import { supabase } from './supabase'

// Gmail OAuth configuration
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar'
]
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1'

export interface GmailEmail {
  id: string
  subject: string
  sender: string
  body: string
  htmlBody?: string
  receivedAt: string
  threadId: string
}

export interface ParsedSubscription {
  serviceName: string
  type: 'trial' | 'subscription'
  amount?: number
  currency?: string
  billingCycle?: string
  startDate?: string
  endDate?: string
  trialEndDate?: string
  renewalDate?: string
  cancelUrl?: string
  confidence: number
  sourceEmailId: string
}

export interface GmailTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export class GmailService {
  // List of legitimate service names to validate against
  private static readonly LEGITIMATE_SERVICES = [
    'Netflix', 'Spotify', 'Adobe', 'Microsoft', 'Google', 'Apple', 'Amazon',
    'Disney', 'Hulu', 'YouTube', 'Zoom', 'Slack', 'Dropbox', 'Figma',
    'Canva', 'GitHub', 'GitLab', 'Notion', 'Airtable', 'Mailchimp',
    'ConvertKit', 'Mailerlite', 'Substack', 'Medium', 'LinkedIn',
    'Salesforce', 'HubSpot', 'Intercom', 'Zendesk', 'Freshworks',
    'Atlassian', 'Jira', 'Confluence', 'Trello', 'Asana', 'Monday.com',
    'ClickUp', 'Todoist', 'Evernote', 'OneNote', 'Box', 'OneDrive',
    'iCloud', 'Backblaze', 'Carbonite', '1Password', 'LastPass',
    'Bitwarden', 'NordVPN', 'ExpressVPN', 'Surfshark', 'CyberGhost',
    'Grammarly', 'Hemingway', 'ProWritingAid', 'Squarespace', 'Wix',
    'WordPress', 'Webflow', 'Shopify', 'BigCommerce', 'WooCommerce',
    'Stripe', 'PayPal', 'Square', 'QuickBooks', 'FreshBooks',
    'Wave', 'Xero', 'TurboTax', 'H&R Block', 'TaxAct'
  ]

  /**
   * Validate if a service name is from a legitimate company
   */
  private static isLegitimateService(serviceName: string): boolean {
    if (!serviceName) return false
    
    // Check exact matches (case insensitive)
    const normalizedService = serviceName.toLowerCase().trim()
    return this.LEGITIMATE_SERVICES.some(service => 
      service.toLowerCase() === normalizedService
    )
  }
  
  /**
   * STEP 1: Gmail OAuth Integration
   * Initiate OAuth flow to get Gmail read access
   */
  static async initiateGmailOAuth(): Promise<string> {
    try {
      // Debug: Log environment variable status
      console.log('Environment check:', {
        clientIdExists: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        clientIdLength: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.length || 0,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE'))
      })

      // Get current session to ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('User must be authenticated first')
      }

      // Create OAuth URL for Gmail access
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        throw new Error('Google Client ID not configured')
      }

      const redirectUri = `${window.location.origin}/auth/gmail/callback`
      const scope = GMAIL_SCOPES.join(' ')
      
      // Create a more robust state parameter
      const state = btoa(JSON.stringify({
        userId: session.user.id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(2)
      }))

      // Debug: Log the exact redirect URI being used
      console.log('OAuth Debug Info:', {
        clientId: clientId.substring(0, 20) + '...',
        redirectUri,
        origin: window.location.origin,
        scope,
        state: state.substring(0, 20) + '...',
        userId: session.user.id
      })

      const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      oauthUrl.searchParams.set('client_id', clientId)
      oauthUrl.searchParams.set('redirect_uri', redirectUri)
      oauthUrl.searchParams.set('scope', scope)
      oauthUrl.searchParams.set('response_type', 'code')
      oauthUrl.searchParams.set('access_type', 'offline')
      oauthUrl.searchParams.set('prompt', 'consent')
      oauthUrl.searchParams.set('state', state)

      // Debug: Log the final OAuth URL
      console.log('Final OAuth URL:', oauthUrl.toString())

      return oauthUrl.toString()
    } catch (error) {
      console.error('Error initiating Gmail OAuth:', error)
      throw error
    }
  }

  /**
   * Exchange OAuth code for access tokens and store them
   */
  static async handleOAuthCallback(code: string, state: string): Promise<boolean> {
    try {
      // Verify state matches current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('User must be authenticated first')
      }

      // Decode state to get original user ID
      let decodedState
      try {
        decodedState = JSON.parse(atob(state))
      } catch (error) {
        console.error('Failed to decode state:', error)
        throw new Error('Invalid OAuth state format')
      }

      if (decodedState.userId !== session.user.id) {
        console.error('Invalid OAuth state - user mismatch:', {
          expectedUserId: decodedState.userId,
          currentUserId: session.user.id
        })
        throw new Error('Invalid OAuth state - user mismatch')
      }

      // Use server-side API route for token exchange
      const response = await fetch('/api/gmail/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify({ code, state }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Token exchange failed')
      }

      return true
    } catch (error) {
      console.error('Error handling OAuth callback:', error)
      throw error
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  static async getValidAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      // Get stored tokens
      const { data: tokenData, error } = await supabase
        .from('gmail_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error || !tokenData) {
        console.log('No Gmail tokens found')
        return null
      }

      // Check if token is still valid
      const expiresAt = new Date(tokenData.expires_at).getTime()
      const now = Date.now()

      if (now < expiresAt - 60000) { // Valid for at least 1 more minute
        return tokenData.access_token
      }

      // Token expired, refresh it
      console.log('Access token expired, refreshing...')
      return await this.refreshAccessToken()
    } catch (error) {
      console.error('Error getting valid access token:', error)
      return null
    }
  }

  /**
   * Refresh expired access token using server-side API
   */
  static async refreshAccessToken(): Promise<string | null> {
    try {
      console.log('Refreshing access token via server-side API...')
      
      const response = await fetch('/api/gmail/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Token refresh failed:', errorData)
        throw new Error(`Token refresh failed: ${errorData.error}`)
      }

      const data = await response.json()
      console.log('Token refreshed successfully')
      
      return data.access_token
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return null
    }
  }

  /**
   * STEP 2: Fetch Relevant Emails via Gmail API
   * Search for subscription-related emails from the last 30 days
   */
  static async fetchRelevantEmails(): Promise<GmailEmail[]> {
    try {
      const accessToken = await this.getValidAccessToken()
      if (!accessToken) {
        throw new Error('No valid Gmail access token')
      }

      // Smart query to find subscription-related emails
      const query = 'subject:(trial OR subscription OR confirm OR welcome OR billing OR payment OR renewal OR upgrade OR premium OR pro OR plan OR membership) newer_than:30d'

      // First, search for message IDs
      const searchResponse = await fetch(
        `${GMAIL_API_BASE}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const searchData = await searchResponse.json()
      
      if (!searchResponse.ok) {
        throw new Error(`Gmail search failed: ${searchData.error?.message}`)
      }

      if (!searchData.messages || searchData.messages.length === 0) {
        console.log('No relevant emails found')
        return []
      }

      console.log(`Found ${searchData.messages.length} relevant emails`)

      // Fetch full message details for each email
      const emails: GmailEmail[] = []
      for (const message of searchData.messages.slice(0, 20)) { // Limit to 20 for now
        try {
          const email = await this.fetchEmailDetails(message.id, accessToken)
          if (email) {
            emails.push(email)
          }
        } catch (error) {
          console.error(`Error fetching email ${message.id}:`, error)
          // Continue with other emails
        }
      }

      console.log(`Successfully fetched ${emails.length} email details`)
      return emails
    } catch (error) {
      console.error('Error fetching relevant emails:', error)
      throw error
    }
  }

  /**
   * Fetch detailed email content
   */
  static async fetchEmailDetails(messageId: string, accessToken: string): Promise<GmailEmail | null> {
    try {
      const response = await fetch(
        `${GMAIL_API_BASE}/users/me/messages/${messageId}?format=full`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const messageData = await response.json()
      
      if (!response.ok) {
        throw new Error(`Failed to fetch email details: ${messageData.error?.message}`)
      }

      // Extract headers
      const headers = messageData.payload.headers
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
      const from = headers.find((h: any) => h.name === 'From')?.value || ''
      const date = headers.find((h: any) => h.name === 'Date')?.value || ''

      // Extract body content
      let textBody = ''
      let htmlBody = ''

      const extractBody = (payload: any) => {
        if (payload.body?.data) {
          const decoded = Buffer.from(payload.body.data, 'base64').toString('utf-8')
          if (payload.mimeType === 'text/plain') {
            textBody += decoded
          } else if (payload.mimeType === 'text/html') {
            htmlBody += decoded
          }
        }

        if (payload.parts) {
          payload.parts.forEach((part: any) => extractBody(part))
        }
      }

      extractBody(messageData.payload)

      // Use text body, fallback to HTML if no text
      const body = textBody || this.htmlToText(htmlBody)

      return {
        id: messageId,
        subject,
        sender: from,
        body,
        htmlBody,
        receivedAt: new Date(date).toISOString(),
        threadId: messageData.threadId
      }
    } catch (error) {
      console.error(`Error fetching email details for ${messageId}:`, error)
      return null
    }
  }

  /**
   * Convert HTML to plain text (basic)
   */
  static htmlToText(html: string): string {
    if (!html) return ''
    return html
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * STEP 3: Parse Emails Using AI (OpenAI GPT-4)
   */
  static async parseEmailWithAI(email: GmailEmail): Promise<ParsedSubscription | null> {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY
      if (!openaiApiKey) {
        console.log('OpenAI API key not configured, falling back to basic parsing')
        return this.parseEmailWithBasicRules(email)
      }

      console.log(`Parsing email with AI: ${email.subject}`)

      // First, check if this email is likely to be a subscription confirmation
      const subject = email.subject.toLowerCase()
      const body = email.body.toLowerCase()
      const sender = email.sender.toLowerCase()

      // Immediate rejection criteria - don't even send to AI
      const rejectKeywords = [
        'unsubscribe', 'newsletter', 'marketing', 'promotional', 'sale', 'discount',
        'offer', 'deal', 'free shipping', 'coupon', 'promo', 'spam', 'bulk',
        'mailing list', 'opt-out', 'update your preferences', 'email preferences',
        'notification settings', 'privacy policy', 'terms of service'
      ]

      const hasRejectKeywords = rejectKeywords.some(keyword => 
        subject.includes(keyword) || body.includes(keyword)
      )

      if (hasRejectKeywords) {
        console.log(`❌ Auto-rejected email with marketing keywords: ${email.subject}`)
        return null
      }

      // Must contain confirmation indicators
      const confirmationKeywords = [
        'welcome to', 'subscription confirmed', 'trial started', 'signup confirmed',
        'registration complete', 'account created', 'billing confirmation',
        'payment confirmation', 'subscription activated', 'trial activated'
      ]

      const hasConfirmationKeywords = confirmationKeywords.some(keyword => 
        subject.includes(keyword) || body.includes(keyword)
      )

      if (!hasConfirmationKeywords) {
        console.log(`❌ Auto-rejected email without confirmation keywords: ${email.subject}`)
        return null
      }

      const prompt = `You are an EXTREMELY STRICT subscription detector. You MUST be 100% certain this is a legitimate subscription confirmation.

ONLY return true if ALL of these are true:
1. This email CONFIRMS a user has successfully signed up for a PAID service
2. The company is a well-known legitimate business (Netflix, Spotify, Adobe, Microsoft, etc.)
3. Contains explicit confirmation language ("Welcome to [Service] Premium", "Your subscription is confirmed")
4. Has clear pricing or trial information
5. Is NOT a marketing email, newsletter, or promotional offer

AUTOMATICALLY REJECT if ANY of these:
- Contains "unsubscribe", "newsletter", "marketing", "promotional"
- Is about free accounts or basic plans
- Lacks clear confirmation language
- From unknown companies
- Contains sale/discount/offer language

Email Subject: ${email.subject}
Email From: ${email.sender}
Email Content: ${email.body.substring(0, 1500)} ${email.body.length > 1500 ? '...' : ''}

BE EXTREMELY CONSERVATIVE. When in doubt, return false.

Respond ONLY with valid JSON:
{
  "isSubscription": true/false,
  "serviceName": "Exact Company Name" or null,
  "type": "trial" or "subscription",
  "amount": 9.99 or null,
  "currency": "USD" or null,
  "billingCycle": "monthly" or null,
  "startDate": "2025-01-16" or null,
  "endDate": "2025-02-16" or null,
  "trialEndDate": "2025-02-16" or null,
  "renewalDate": "2025-02-16" or null,
  "cancelUrl": "https://..." or null,
  "confidence": 0.95
}

If this is NOT a legitimate subscription confirmation, return {"isSubscription": false, "confidence": 0.0}`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using the cost-effective model
          messages: [
            {
              role: 'system',
              content: 'You are a precise subscription detection system. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('OpenAI API error:', errorData)
        throw new Error(`OpenAI API failed: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content

      if (!aiResponse) {
        throw new Error('No response from OpenAI')
      }

      console.log('AI Response:', aiResponse)

      // Parse the JSON response
      let parsedResponse
      try {
        parsedResponse = JSON.parse(aiResponse)
      } catch (error) {
        console.error('Failed to parse AI response as JSON:', aiResponse)
        throw new Error('Invalid JSON response from AI')
      }

      // Validate response
      if (!parsedResponse.isSubscription) {
        console.log(`AI determined this is not a subscription email: ${email.subject}`)
        return null
      }

      if (!parsedResponse.serviceName) {
        console.log(`AI could not determine service name for: ${email.subject}`)
        return null
      }

      // Convert to our format
      return {
        serviceName: parsedResponse.serviceName,
        type: parsedResponse.type || 'subscription',
        amount: parsedResponse.amount,
        currency: parsedResponse.currency || 'USD',
        billingCycle: parsedResponse.billingCycle,
        startDate: parsedResponse.startDate,
        endDate: parsedResponse.endDate,
        trialEndDate: parsedResponse.trialEndDate,
        renewalDate: parsedResponse.renewalDate,
        cancelUrl: parsedResponse.cancelUrl,
        confidence: parsedResponse.confidence || 0.5,
        sourceEmailId: email.id
      }

    } catch (error) {
      console.error(`Error parsing email ${email.id} with AI:`, error)
      console.log('Falling back to basic rule-based parsing')
      return this.parseEmailWithBasicRules(email)
    }
  }

  /**
   * Check if Gmail is connected for current user
   */
  static async isGmailConnected(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      const { data, error } = await supabase
        .from('gmail_tokens')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }

  /**
   * Main function to connect Gmail and parse emails
   */
  static async connectGmail(): Promise<boolean> {
    try {
      // Check if already connected
      const isConnected = await this.isGmailConnected()
      if (!isConnected) {
        // Initiate OAuth flow
        const oauthUrl = await this.initiateGmailOAuth()
        window.location.href = oauthUrl
        return false // Will redirect, so return false for now
      }

      // Already connected, fetch and parse emails
      console.log('Gmail already connected, fetching emails...')
      const emails = await this.fetchRelevantEmails()
      console.log(`Fetched ${emails.length} relevant emails`)

      // For now, return success
      // TODO: Implement AI parsing in next step
      return true
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      throw error
    }
  }

  /**
   * Parse all fetched emails using AI-powered parsing with fallback to basic rules
   */
  static async parseAllEmails(): Promise<ParsedSubscription[]> {
    try {
      const emails = await this.fetchRelevantEmails()
      console.log(`Parsing ${emails.length} emails with AI...`)

      const parsedSubscriptions: ParsedSubscription[] = []

      for (const email of emails) {
        try {
          console.log(`Processing email: ${email.subject}`)
          
          // Try AI parsing first
          const parsed = await this.parseEmailWithAI(email)
          if (parsed) {
            // Only accept very high-confidence results (minimum 0.9) from legitimate services
            if (parsed.confidence >= 0.9 && this.isLegitimateService(parsed.serviceName)) {
              parsedSubscriptions.push(parsed)
              console.log(`✅ High-confidence subscription detected: ${parsed.serviceName} (${parsed.type}) - Confidence: ${parsed.confidence}`)
                         } else if (parsed.confidence < 0.9) {
               console.log(`❌ Low confidence (${parsed.confidence}) for: ${parsed.serviceName} - skipping`)
            } else {
              console.log(`❌ Unknown/illegitimate service: ${parsed.serviceName} - skipping`)
            }
          } else {
            console.log(`No subscription detected in: ${email.subject}`)
          }
        } catch (error) {
          console.error(`Error parsing email ${email.id}:`, error)
          // Continue with other emails
        }
      }

      console.log(`Successfully parsed ${parsedSubscriptions.length} subscriptions from ${emails.length} emails`)
      return parsedSubscriptions
    } catch (error) {
      console.error('Error parsing emails:', error)
      return []
    }
  }

  /**
   * Parse email using basic rule-based logic
   */
  static async parseEmailWithBasicRules(email: GmailEmail): Promise<ParsedSubscription | null> {
    try {
      const subject = email.subject.toLowerCase()
      const body = email.body.toLowerCase()
      const content = `${subject} ${body}`
      const sender = email.sender.toLowerCase()

      // Extract service name from sender or subject
      let serviceName = this.extractServiceName(email.sender, email.subject)
      if (!serviceName) {
        console.log(`Could not determine service name for: ${email.subject}`)
        return null
      }

      // Determine if it's a trial or subscription
      const type = this.determineSubscriptionType(content)

      // Extract amount and currency
      const { amount, currency } = this.extractPricing(content)

      // Extract dates
      const dates = this.extractDates(content, type)

      // Calculate confidence based on keywords found
      const confidence = this.calculateConfidence(content, type, amount !== undefined)

      // Only return if we have reasonable confidence
      if (confidence < 0.3) {
        console.log(`Low confidence (${confidence}) for: ${email.subject}`)
        return null
      }

      return {
        serviceName,
        type,
        amount,
        currency,
        billingCycle: amount ? this.extractBillingCycle(content) : undefined,
        startDate: dates.startDate,
        endDate: dates.endDate,
        trialEndDate: dates.trialEndDate,
        renewalDate: dates.renewalDate,
        cancelUrl: this.extractCancelUrl(email.body),
        confidence,
        sourceEmailId: email.id
      }
    } catch (error) {
      console.error(`Error parsing email ${email.id}:`, error)
      return null
    }
  }

  /**
   * Extract service name from sender email or subject
   */
  static extractServiceName(sender: string, subject: string): string | null {
    // Extract from sender email domain
    const emailMatch = sender.match(/<([^@]+@([^>]+))>/)
    if (emailMatch) {
      const domain = emailMatch[2]
      const serviceName = domain.split('.')[0]
      
      // Common service mappings
      const serviceMap: { [key: string]: string } = {
        'spotify': 'Spotify',
        'netflix': 'Netflix',
        'adobe': 'Adobe',
        'microsoft': 'Microsoft',
        'google': 'Google',
        'apple': 'Apple',
        'amazon': 'Amazon',
        'dropbox': 'Dropbox',
        'slack': 'Slack',
        'zoom': 'Zoom',
        'canva': 'Canva',
        'figma': 'Figma',
        'notion': 'Notion',
        'discord': 'Discord',
        'youtube': 'YouTube',
        'hulu': 'Hulu',
        'disney': 'Disney+',
        'paramount': 'Paramount+',
        'hbo': 'HBO Max'
      }

      if (serviceMap[serviceName]) {
        return serviceMap[serviceName]
      }

      // Capitalize first letter
      return serviceName.charAt(0).toUpperCase() + serviceName.slice(1)
    }

    // Extract from subject line
    const subjectWords = subject.toLowerCase().split(' ')
    for (const word of subjectWords) {
      if (word.length > 3 && !['your', 'the', 'trial', 'subscription', 'welcome', 'thank'].includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
    }

    return null
  }

  /**
   * Determine if it's a trial or subscription
   */
  static determineSubscriptionType(content: string): 'trial' | 'subscription' {
    const trialKeywords = ['trial', 'free trial', 'trial period', 'trial ending', 'trial expires']
    const subscriptionKeywords = ['subscription', 'billing', 'payment', 'renewal', 'charge']

    const trialScore = trialKeywords.reduce((score, keyword) => 
      score + (content.includes(keyword) ? 1 : 0), 0)
    const subscriptionScore = subscriptionKeywords.reduce((score, keyword) => 
      score + (content.includes(keyword) ? 1 : 0), 0)

    return trialScore > subscriptionScore ? 'trial' : 'subscription'
  }

  /**
   * Extract pricing information
   */
  static extractPricing(content: string): { amount: number | undefined, currency: string | undefined } {
    // Currency patterns
    const patterns = [
      /\$(\d+(?:\.\d{2})?)/,
      /(\d+(?:\.\d{2})?)\s*(?:usd|dollars?)/i,
      /€(\d+(?:\.\d{2})?)/,
      /£(\d+(?:\.\d{2})?)/,
      /(\d+(?:\.\d{2})?)\s*(?:eur|euros?)/i,
      /(\d+(?:\.\d{2})?)\s*(?:gbp|pounds?)/i
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        const amount = parseFloat(match[1])
        let currency = 'USD'
        
        if (content.includes('€') || /eur/i.test(content)) currency = 'EUR'
        else if (content.includes('£') || /gbp/i.test(content)) currency = 'GBP'
        
        return { amount, currency }
      }
    }

    return { amount: undefined, currency: undefined }
  }

  /**
   * Extract billing cycle
   */
  static extractBillingCycle(content: string): string | undefined {
    if (content.includes('monthly') || content.includes('month')) return 'monthly'
    if (content.includes('yearly') || content.includes('annual') || content.includes('year')) return 'yearly'
    if (content.includes('weekly') || content.includes('week')) return 'weekly'
    return undefined
  }

  /**
   * Extract dates from content
   */
  static extractDates(content: string, type: 'trial' | 'subscription'): {
    startDate?: string,
    endDate?: string,
    trialEndDate?: string,
    renewalDate?: string
  } {
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{4}-\d{2}-\d{2})/g,
      /(\w+ \d{1,2},? \d{4})/g
    ]

    const dates: string[] = []
    for (const pattern of datePatterns) {
      const matches = content.match(pattern)
      if (matches) {
        dates.push(...matches)
      }
    }

    // Try to parse and validate dates
    const validDates = dates
      .map(dateStr => {
        try {
          const date = new Date(dateStr)
          return isNaN(date.getTime()) ? null : date.toISOString()
        } catch {
          return null
        }
      })
      .filter(date => date !== null) as string[]

    if (validDates.length === 0) return {}

    // For trials, first date is usually end date
    if (type === 'trial' && validDates.length > 0) {
      return { trialEndDate: validDates[0] }
    }

    // For subscriptions, look for renewal dates
    if (type === 'subscription' && validDates.length > 0) {
      return { renewalDate: validDates[0] }
    }

    return {}
  }

  /**
   * Extract cancel URL from email body
   */
  static extractCancelUrl(body: string): string | undefined {
    const urlPattern = /https?:\/\/[^\s<>"']+(?:cancel|unsubscribe|manage)[^\s<>"']*/gi
    const match = body.match(urlPattern)
    return match ? match[0] : undefined
  }

  /**
   * Calculate confidence score based on keywords and data found
   */
  static calculateConfidence(content: string, type: 'trial' | 'subscription', hasAmount: boolean): number {
    let confidence = 0.1 // Base confidence

    // Keywords boost confidence
    const keywords = [
      'subscription', 'trial', 'billing', 'payment', 'renewal', 'welcome',
      'confirm', 'activate', 'upgrade', 'premium', 'pro', 'plan'
    ]

    const keywordMatches = keywords.filter(keyword => content.includes(keyword)).length
    confidence += keywordMatches * 0.1

    // Having amount increases confidence
    if (hasAmount) confidence += 0.3

    // Type-specific keywords
    if (type === 'trial' && (content.includes('trial') || content.includes('free'))) {
      confidence += 0.2
    }
    if (type === 'subscription' && (content.includes('subscription') || content.includes('billing'))) {
      confidence += 0.2
    }

    return Math.min(confidence, 1.0) // Cap at 1.0
  }
} 
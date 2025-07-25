import { EmailData } from '@/types'

interface ServiceName {
  value: string
  confidence: number
  from_whitelist: boolean
}

interface ParsedEmailData {
  service_name: ServiceName | null
  trial_end: string | null
  first_charge: string | null
  renewal: string | null
  confidence: number
  review: boolean
  matched_phrases: string[]
  source: string
  language: string
}

export class EmailParser {
  // Whitelist of legitimate services (from gmail.ts)
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
    'Wave', 'Xero', 'TurboTax', 'H&R Block', 'TaxAct', 'Headspace',
    'Duolingo', 'Apple TV+', 'Paramount+', 'HBO Max'
  ]

  // Enhanced date patterns
  private static readonly DATE_PATTERNS = [
    // Standard date formats
    /(\d{1,2}\/\d{1,2}\/\d{4})/g,
    /(\d{4}-\d{2}-\d{2})/g,
    /(\w+ \d{1,2},? \d{4})/g,
    // Month names with various formats
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/gi,
    // Month names without year (will infer year from received_at)
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}/gi
  ]

  // Relative date patterns
  private static readonly RELATIVE_DATE_PATTERNS = [
    /in\s+(\d+)\s+days?/gi,
    /in\s+(\d+)\s+weeks?/gi,
    /in\s+(\d+)\s+months?/gi,
    /(\d+)\s+days?\s+from\s+now/gi,
    /(\d+)\s+weeks?\s+from\s+now/gi,
    /(\d+)\s+months?\s+from\s+now/gi,
    /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    /this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    // Additional patterns for better coverage
    /(\d+)\s+days?\s+later/gi,
    /(\d+)\s+days?\s+after/gi,
    /billed\s+in\s+(\d+)\s+days?/gi,
    /charged\s+in\s+(\d+)\s+days?/gi
  ]

  // Trial-related keywords and phrases
  private static readonly TRIAL_PHRASES = [
    'trial ends on', 'trial ends', 'trial ending', 'trial expires',
    'free trial ends', 'trial period ends', 'trial will end',
    'trial expires on', 'trial ends at', 'trial will expire'
  ]

  // First charge keywords and phrases
  private static readonly FIRST_CHARGE_PHRASES = [
    'first charge', 'first payment', 'first billing', 'first charge will occur',
    'will be charged', 'will be billed', 'you\'ll be charged', 'you\'ll be billed',
    'first charge on', 'first payment on', 'billing begins', 'payment begins', 
    'charge begins', 'charged on', 'billed on'
  ]

  // Renewal keywords and phrases
  private static readonly RENEWAL_PHRASES = [
    'renewal date', 'renews on', 'renewal on', 'will renew on',
    'next billing', 'next payment', 'next charge', 'billing cycle',
    'renewal cycle', 'subscription renews'
  ]

  // Currency patterns
  private static readonly CURRENCY_PATTERNS = [
    /\$(\d+(?:\.\d{2})?)/g,
    /(\d+(?:\.\d{2})?)\s*(USD|EUR|GBP|CAD)/g,
    /€(\d+(?:\.\d{2})?)/g,
    /£(\d+(?:\.\d{2})?)/g
  ]

  static async parseEmail(email: EmailData): Promise<ParsedEmailData> {
    const content = `${email.subject} ${email.body}`.toLowerCase()
    const receivedAt = new Date(email.received_at)
    
    // Language detection (basic)
    const language = this.detectLanguage(content)
    if (language !== 'en') {
      return {
        service_name: null,
        trial_end: null,
        first_charge: null,
        renewal: null,
        confidence: 0.1,
        review: true,
        matched_phrases: [],
        source: 'language_detection',
        language
      }
    }

    // Extract service name
    const serviceName = this.extractServiceName(email.sender, email.subject, email.body)
    
    // Extract dates with context
    const dates = this.extractDatesWithContext(content, receivedAt)
    
    // Calculate overall confidence
    const confidence = this.calculateConfidence(content, serviceName, dates)
    
    // Determine if review is needed
    const review = confidence < 0.7 || !serviceName || (!dates.trial_end && !dates.first_charge && !dates.renewal)
    
    return {
      service_name: serviceName,
      trial_end: dates.trial_end,
      first_charge: dates.first_charge,
      renewal: dates.renewal,
      confidence,
      review,
      matched_phrases: dates.matched_phrases,
      source: dates.source,
      language
    }
  }

  private static detectLanguage(content: string): string {
    // Basic English detection - look for common English words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    const englishWordCount = englishWords.filter(word => content.includes(word)).length
    
    // If we find few English words, it might be non-English
    if (englishWordCount < 3) {
      return 'unknown'
    }
    
    return 'en'
  }

  private static extractServiceName(sender: string, subject: string, body: string): ServiceName | null {
    // First, try to extract from body content (highest priority for specific names)
    const fullBody = body.toLowerCase()
    // Sort services by length (longest first) to match more specific names first
    const sortedServices = [...this.LEGITIMATE_SERVICES].sort((a, b) => b.length - a.length)
    for (const service of sortedServices) {
      if (fullBody.includes(service.toLowerCase())) {
        return {
          value: service,
          confidence: 0.8,
          from_whitelist: true
        }
      }
    }
    
    // Try to extract from sender email domain
    const emailMatch = sender.match(/<([^@]+@([^>]+))>/)
    if (emailMatch) {
      const domain = emailMatch[2]
      const serviceName = domain.split('.')[0]
      
      // Check if it's in our whitelist
      const whitelistMatch = this.LEGITIMATE_SERVICES.find(service => 
        service.toLowerCase() === serviceName.toLowerCase()
      )
      
      if (whitelistMatch) {
        return {
          value: whitelistMatch,
          confidence: 0.95,
          from_whitelist: true
        }
      }
      
      // Not in whitelist but we have a domain
      return {
        value: serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
        confidence: 0.7,
        from_whitelist: false
      }
    }

    // Try to extract from body (look for service mentions)
    const bodyLines = body.toLowerCase().split('\n')
    for (const line of bodyLines) {
      for (const service of this.LEGITIMATE_SERVICES) {
        if (line.includes(service.toLowerCase())) {
          return {
            value: service,
            confidence: 0.8,
            from_whitelist: true
          }
        }
      }
    }

    // Try to extract from subject line
    const subjectWords = subject.toLowerCase().split(' ')
    for (const word of subjectWords) {
      if (word.length > 3 && !['your', 'the', 'trial', 'subscription', 'welcome', 'thank'].includes(word)) {
        const whitelistMatch = this.LEGITIMATE_SERVICES.find(service => 
          service.toLowerCase() === word.toLowerCase()
        )
        
        if (whitelistMatch) {
          return {
            value: whitelistMatch,
            confidence: 0.85,
            from_whitelist: true
          }
        }
        
        return {
          value: word.charAt(0).toUpperCase() + word.slice(1),
          confidence: 0.6,
          from_whitelist: false
        }
      }
    }

    return null
  }

  private static extractDatesWithContext(content: string, receivedAt: Date): {
    trial_end: string | null
    first_charge: string | null
    renewal: string | null
    matched_phrases: string[]
    source: string
  } {
    const matched_phrases: string[] = []
    let trial_end: string | null = null
    let first_charge: string | null = null
    let renewal: string | null = null
    let source = 'body'

    // Extract absolute dates first
    const absoluteDates = this.extractAbsoluteDates(content, receivedAt)
    
    // Extract relative dates
    const relativeDates = this.extractRelativeDates(content, receivedAt)
    
    // Combine and prioritize dates based on context
    const allDates = [...absoluteDates, ...relativeDates]
    
    // Find trial end dates - look for specific trial end phrases
    for (const phrase of this.TRIAL_PHRASES) {
      if (content.includes(phrase)) {
        const nearbyDate = this.findDateNearPhrase(content, phrase, allDates)
        if (nearbyDate && !trial_end) {
          trial_end = nearbyDate
          matched_phrases.push(`Found trial end: ${phrase}`)
        }
      }
    }
    
    // Find first charge dates - look for specific first charge phrases
    for (const phrase of this.FIRST_CHARGE_PHRASES) {
      if (content.includes(phrase)) {
        const nearbyDate = this.findDateNearPhrase(content, phrase, allDates)
        if (nearbyDate && !first_charge) {
          first_charge = nearbyDate
          matched_phrases.push(`Found first charge: ${phrase}`)
        }
      }
    }
    
    // Find renewal dates - look for specific renewal phrases
    for (const phrase of this.RENEWAL_PHRASES) {
      if (content.includes(phrase)) {
        const nearbyDate = this.findDateNearPhrase(content, phrase, allDates)
        if (nearbyDate && !renewal) {
          renewal = nearbyDate
          matched_phrases.push(`Found renewal: ${phrase}`)
        }
      }
    }
    
    // If no specific context found, assign dates based on content analysis
    if (!trial_end && !first_charge && !renewal && allDates.length > 0) {
      // Look for specific patterns in the content
      const hasTrialKeywords = content.includes('trial') || content.includes('free trial')
      const hasChargeKeywords = content.includes('charge') || content.includes('billing') || content.includes('payment') || content.includes('billed')
      const hasWillBeCharged = content.includes('will be charged') || content.includes('will be billed') || content.includes('you\'ll be charged') || content.includes('you\'ll be billed')
      const hasFirstCharge = content.includes('first charge')
      
      // Check for "will be charged on [date]" pattern
      if (hasWillBeCharged && !first_charge) {
        first_charge = allDates[0]
        matched_phrases.push('Assigned first date as first charge (will be charged pattern)')
      }
      // Check for "first charge will occur on [date]" pattern
      else if (hasFirstCharge && !first_charge) {
        first_charge = allDates[0]
        matched_phrases.push('Assigned first date as first charge (first charge pattern)')
      }
      // Check for trial keywords
      else if (hasTrialKeywords && !trial_end) {
        trial_end = allDates[0]
        matched_phrases.push('Assigned first date as trial end (trial keywords found)')
      }
      // Check for charge keywords
      else if (hasChargeKeywords && !first_charge) {
        first_charge = allDates[0]
        matched_phrases.push('Assigned first date as first charge (charge keywords found)')
      }
      // Default to first charge if no clear context
      else if (allDates.length > 0) {
        first_charge = allDates[0]
        matched_phrases.push('Assigned first date as first charge (default)')
      }
    }

    return {
      trial_end,
      first_charge,
      renewal,
      matched_phrases,
      source
    }
  }

  private static extractAbsoluteDates(content: string, receivedAt?: Date): string[] {
    const dates: string[] = []
    
    for (const pattern of this.DATE_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        for (const match of matches) {
          try {
            let dateStr = match
            
            // Handle month names without year by adding the current year
            if (receivedAt && !/\d{4}/.test(match)) {
              const year = receivedAt.getFullYear()
              dateStr = `${match}, ${year}`
            }
            
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              dates.push(date.toISOString().split('T')[0])
            }
          } catch {
            // Skip invalid dates
          }
        }
      }
    }
    
    return dates
  }

  private static extractRelativeDates(content: string, receivedAt: Date): string[] {
    const dates: string[] = []
    
    for (const pattern of this.RELATIVE_DATE_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        for (const match of matches) {
          try {
            const calculatedDate = this.calculateRelativeDate(match, receivedAt)
            if (calculatedDate) {
              dates.push(calculatedDate.toISOString().split('T')[0])
            }
          } catch {
            // Skip invalid relative dates
          }
        }
      }
    }
    
    return dates
  }

  private static calculateRelativeDate(phrase: string, baseDate: Date): Date | null {
    const lowerPhrase = phrase.toLowerCase()
    
    // Handle "in X days"
    const daysMatch = lowerPhrase.match(/in\s+(\d+)\s+days?/)
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      const result = new Date(baseDate)
      result.setDate(result.getDate() + days)
      return result
    }
    
    // Handle "in X weeks"
    const weeksMatch = lowerPhrase.match(/in\s+(\d+)\s+weeks?/)
    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1])
      const result = new Date(baseDate)
      result.setDate(result.getDate() + (weeks * 7))
      return result
    }
    
    // Handle "in X months"
    const monthsMatch = lowerPhrase.match(/in\s+(\d+)\s+months?/)
    if (monthsMatch) {
      const months = parseInt(monthsMatch[1])
      const result = new Date(baseDate)
      result.setMonth(result.getMonth() + months)
      return result
    }
    
    // Handle "X days from now"
    const daysFromNowMatch = lowerPhrase.match(/(\d+)\s+days?\s+from\s+now/)
    if (daysFromNowMatch) {
      const days = parseInt(daysFromNowMatch[1])
      const result = new Date(baseDate)
      result.setDate(result.getDate() + days)
      return result
    }
    
         // Handle "next [day of week]"
     const nextDayMatch = lowerPhrase.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)
     if (nextDayMatch) {
       const targetDay = nextDayMatch[1]
       const dayMap: { [key: string]: number } = {
         'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
         'thursday': 4, 'friday': 5, 'saturday': 6
       }
       const targetDayNum = dayMap[targetDay]
       const result = new Date(baseDate)
       const currentDay = result.getDay()
       let daysToAdd = (targetDayNum - currentDay + 7) % 7
       if (daysToAdd === 0) daysToAdd = 7 // Next week if same day
       result.setDate(result.getDate() + daysToAdd)
       return result
     }
    
    return null
  }

  private static findDateNearPhrase(content: string, phrase: string, dates: string[]): string | null {
    if (dates.length === 0) return null
    
    // Find the position of the phrase in the content
    const phraseIndex = content.indexOf(phrase)
    if (phraseIndex === -1) return null
    
    // Look for dates near this phrase (within 100 characters)
    const searchStart = Math.max(0, phraseIndex - 50)
    const searchEnd = Math.min(content.length, phraseIndex + phrase.length + 50)
    const nearbyText = content.substring(searchStart, searchEnd)
    
    // Find the first date that appears in the nearby text
    for (const date of dates) {
      if (nearbyText.includes(date)) {
        return date
      }
    }
    
    // If no date found nearby, return the first available date
    return dates[0]
  }

  private static calculateConfidence(content: string, serviceName: ServiceName | null, dates: {
    trial_end: string | null
    first_charge: string | null
    renewal: string | null
    matched_phrases: string[]
  }): number {
    let confidence = 0.1 // Base confidence
    
    // Service name confidence
    if (serviceName) {
      confidence += serviceName.confidence * 0.3
    }
    
    // Date confidence
    const hasAnyDate = dates.trial_end || dates.first_charge || dates.renewal
    if (hasAnyDate) {
      confidence += 0.4
      
      // Bonus for multiple dates
      const dateCount = [dates.trial_end, dates.first_charge, dates.renewal].filter(Boolean).length
      if (dateCount > 1) {
        confidence += 0.1
      }
    }
    
    // Keyword confidence
    const keywords = [
      'subscription', 'trial', 'billing', 'payment', 'renewal', 'welcome',
      'confirm', 'activate', 'upgrade', 'premium', 'pro', 'plan', 'charge'
    ]
    
    const keywordMatches = keywords.filter(keyword => content.includes(keyword)).length
    confidence += Math.min(keywordMatches * 0.05, 0.2) // Cap at 0.2
    
    // Context confidence (having matched phrases)
    if (dates.matched_phrases.length > 0) {
      confidence += 0.1
    }
    
    // Penalty for no dates
    if (!hasAnyDate) {
      confidence *= 0.5 // Reduce confidence significantly
    }
    
    return Math.min(confidence, 1.0) // Cap at 1.0
  }
} 
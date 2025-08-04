import { EmailData } from '@/types'

interface ParsedEmailData {
  service_name?: string
  amount?: number
  currency?: string
  trial_end?: string
  renewal_date?: string
  subscription_type?: 'trial' | 'subscription'
  confidence: number
}

export class EmailParser {
  private static readonly TRIAL_KEYWORDS = [
    'trial', 'free trial', 'trial period', 'trial ending', 'trial expires',
    'trial subscription', 'trial account', 'trial version'
  ]

  private static readonly SUBSCRIPTION_KEYWORDS = [
    'subscription', 'billing', 'payment', 'renewal', 'renew', 'charge',
    'monthly', 'yearly', 'annual', 'premium', 'pro plan'
  ]

  private static readonly CURRENCY_PATTERNS = [
    /\$(\d+(?:\.\d{2})?)/g,
    /(\d+(?:\.\d{2})?)\s*(USD|EUR|GBP|CAD)/g
  ]

  private static readonly DATE_PATTERNS = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/g,
    /(\d{4}-\d{2}-\d{2})/g,
    /(\w+ \d{1,2},? \d{4})/g
  ]

  static async parseEmail(email: EmailData): Promise<ParsedEmailData> {
    const content = `${email.subject} ${email.body}`.toLowerCase()
    
    // Basic rule-based parsing
    const basicResult = this.basicParse(content)
    
    // If we have OpenAI API key, use AI parsing
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiResult = await this.aiParse(email)
        return { ...basicResult, ...aiResult }
      } catch (error) {
        console.warn('AI parsing failed, using basic parsing:', error)
      }
    }
    
    return basicResult
  }

  private static basicParse(content: string): ParsedEmailData {
    const result: ParsedEmailData = {
      confidence: 0.3
    }

    // Detect trial vs subscription
    const trialMatches = this.TRIAL_KEYWORDS.filter(keyword => 
      content.includes(keyword)
    ).length
    const subscriptionMatches = this.SUBSCRIPTION_KEYWORDS.filter(keyword => 
      content.includes(keyword)
    ).length

    if (trialMatches > subscriptionMatches) {
      result.subscription_type = 'trial'
      result.confidence += 0.2
    } else if (subscriptionMatches > 0) {
      result.subscription_type = 'subscription'
      result.confidence += 0.2
    }

    // Extract currency amounts
    for (const pattern of this.CURRENCY_PATTERNS) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        const amount = parseFloat(matches[0].replace(/[^\d.]/g, ''))
        if (!isNaN(amount)) {
          result.amount = amount
          result.currency = 'USD' // Default, could be enhanced
          result.confidence += 0.2
          break
        }
      }
    }

    // Extract dates
    for (const pattern of this.DATE_PATTERNS) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        const date = new Date(matches[0])
        if (!isNaN(date.getTime())) {
          if (result.subscription_type === 'trial') {
            result.trial_end = date.toISOString()
          } else {
            result.renewal_date = date.toISOString()
          }
          result.confidence += 0.2
          break
        }
      }
    }

    return result
  }

  private static async aiParse(email: EmailData): Promise<Partial<ParsedEmailData>> {
    const prompt = `
    Analyze this email and extract subscription/trial information:
    
    Subject: ${email.subject}
    Sender: ${email.sender}
    Body: ${email.body}
    
    Return a JSON object with:
    - service_name: The name of the service/company
    - amount: The subscription amount (number)
    - currency: The currency (3-letter code)
    - trial_end: Trial end date (ISO string) if applicable
    - renewal_date: Next renewal date (ISO string) if applicable
    - subscription_type: "trial" or "subscription"
    
    Only include fields that are clearly present in the email.
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that extracts subscription and trial information from emails. Return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        try {
          return JSON.parse(content);
        } catch (parseError) {
          console.warn('Failed to parse AI response:', parseError);
          return {};
        }
      }
    } catch (error) {
      console.error('AI parsing error:', error);
    }

    return {};
  }
} 
import { EmailParser } from './email-parser'
import { EmailData } from '@/types'

const samples: { name: string; email: EmailData }[] = [
  {
    name: 'Standard Confirmation Email (Hulu)',
    email: {
      id: '1',
      subject: 'Your Hulu Free Trial Has Begun',
      sender: 'Hulu <no-reply@hulu.com>',
      body: `Hi Alex,\n\nThanks for signing up for Hulu. Your free trial starts today and ends on August 15, 2025. After that, you'll be charged $7.99/month unless you cancel.\n\nYou can manage your subscription anytime at hulu.com/account.\n\nThanks,\nThe Hulu Team`,
      received_at: '2025-07-01T12:00:00.000Z'
    }
  },
  {
    name: 'Trial Email with Relative Language (Apple TV+)',
    email: {
      id: '2',
      subject: 'Your Apple TV+ Trial is Active',
      sender: 'Apple <no-reply@apple.com>',
      body: `Hi Jordan,\n\nYour 7-day free trial of Apple TV+ is now active. You'll be charged $9.99 on July 22, 2025, unless you cancel beforehand.\n\nHappy watching!\nApple Support`,
      received_at: '2025-07-15T12:00:00.000Z'
    }
  },
  {
    name: 'Tricky Language – No Explicit Date (Headspace)',
    email: {
      id: '3',
      subject: 'Your Trial Will Convert Soon',
      sender: 'Headspace <no-reply@headspace.com>',
      body: `Welcome to Headspace!\n\nYour free trial is about to convert to a paid subscription. You'll be billed $12.00 in 3 days. No action is needed unless you want to cancel.\n\nStay mindful,\nThe Headspace Team`,
      received_at: '2025-07-10T12:00:00.000Z'
    }
  },
  {
    name: 'Minimal/No Date Provided (Notion)',
    email: {
      id: '4',
      subject: 'Welcome to Notion',
      sender: 'Notion <no-reply@notion.so>',
      body: `Hi Taylor,\n\nThanks for signing up for Notion! You now have access to unlimited pages and blocks.\n\nExplore templates and integrations to get the most out of your workspace.\n\nCheers,\nThe Notion Team`,
      received_at: '2025-07-05T12:00:00.000Z'
    }
  },
  {
    name: 'Non-standard Format – Ambiguous Wording (Duolingo)',
    email: {
      id: '5',
      subject: 'Your First Charge Will Occur Soon',
      sender: 'Duolingo <no-reply@duolingo.com>',
      body: `Hi Casey,\n\nThanks for starting your free trial with Duolingo Plus. If you do not cancel, your subscription will begin automatically and the first charge will occur on July 18.\n\nYour trial includes access to offline lessons and ad-free learning.\n\nDuolingo`,
      received_at: '2025-07-10T12:00:00.000Z'
    }
  }
]

async function runTests() {
  console.log('🧪 Running Email Parser Tests...\n')
  
  for (const { name, email } of samples) {
    console.log(`=== ${name} ===`)
    const result = await EmailParser.parseEmail(email)
    
    console.log('📧 Parsed Result:')
    console.log(JSON.stringify(result, null, 2))
    
    if (result.review) {
      console.log('⚠️  REVIEW: Low confidence or flagged for review')
    }
    
    // Test assertions
    let passed = true
    
    if (name.includes('Hulu')) {
      if (!result.first_charge?.includes('2025-08-15')) {
        console.error('❌ Failed to extract correct first charge date for Hulu')
        passed = false
      }
      if (result.service_name?.value !== 'Hulu') {
        console.error('❌ Failed to extract correct service name for Hulu')
        passed = false
      }
    }
    
    if (name.includes('Apple TV+')) {
      if (!result.first_charge?.includes('2025-07-22')) {
        console.error('❌ Failed to extract correct first charge date for Apple TV+')
        passed = false
      }
      if (result.service_name?.value !== 'Apple TV+') {
        console.error('❌ Failed to extract correct service name for Apple TV+')
        passed = false
      }
    }
    
    if (name.includes('Headspace')) {
      if (!result.first_charge) {
        console.error('❌ Failed to extract any date for Headspace (should parse relative date "in 3 days")')
        passed = false
      }
      if (result.service_name?.value !== 'Headspace') {
        console.error('❌ Failed to extract correct service name for Headspace')
        passed = false
      }
    }
    
    if (name.includes('Notion')) {
      if (result.trial_end || result.first_charge || result.renewal) {
        console.error('❌ Should not extract dates for Notion (no date present)')
        passed = false
      }
      if (!result.review) {
        console.error('❌ Should flag Notion for review (no dates found)')
        passed = false
      }
    }
    
    if (name.includes('Duolingo')) {
      if (!result.first_charge?.includes('2025-07-18')) {
        console.error('❌ Failed to extract date for Duolingo (should parse July 18)')
        passed = false
      }
      if (result.service_name?.value !== 'Duolingo') {
        console.error('❌ Failed to extract correct service name for Duolingo')
        passed = false
      }
    }
    
    if (passed) {
      console.log('✅ All tests passed for this sample\n')
    } else {
      console.log('❌ Some tests failed for this sample\n')
    }
  }
  
  console.log('🏁 Test suite completed!')
}

// Run the tests
runTests().catch(console.error) 
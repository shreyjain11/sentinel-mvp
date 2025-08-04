interface CancellationInfo {
  serviceName: string
  cancelUrl?: string
  cancelMethod: 'url' | 'phone' | 'email' | 'app' | 'account'
  instructions: string
  difficulty: 'easy' | 'medium' | 'hard'
  notes?: string
  alternativeNames?: string[]
}

export const CANCELLATION_DATABASE: CancellationInfo[] = [
  // Streaming Services
  {
    serviceName: 'Netflix',
    cancelUrl: 'https://www.netflix.com/account',
    cancelMethod: 'account',
    instructions: 'Sign in → Account → Cancel Membership',
    difficulty: 'easy',
    alternativeNames: ['netflix.com']
  },
  {
    serviceName: 'Spotify',
    cancelUrl: 'https://www.spotify.com/account/subscription/',
    cancelMethod: 'account',
    instructions: 'Sign in → Your Plan → Change Plan → Cancel Spotify Premium',
    difficulty: 'easy',
    alternativeNames: ['spotify.com']
  },
  {
    serviceName: 'Disney+',
    cancelUrl: 'https://www.disneyplus.com/account/subscription',
    cancelMethod: 'account',
    instructions: 'Sign in → Account → Billing Details → Cancel Subscription',
    difficulty: 'easy',
    alternativeNames: ['disneyplus.com', 'disney plus']
  },
  {
    serviceName: 'Hulu',
    cancelUrl: 'https://secure.hulu.com/account',
    cancelMethod: 'account',
    instructions: 'Sign in → Account → Cancel Your Subscription',
    difficulty: 'easy',
    alternativeNames: ['hulu.com']
  },
  {
    serviceName: 'Amazon Prime',
    cancelUrl: 'https://www.amazon.com/mc/yoursubscriptions',
    cancelMethod: 'account',
    instructions: 'Sign in → Your Account → Prime Membership → End Membership',
    difficulty: 'medium',
    notes: 'Amazon may try to retain you with offers',
    alternativeNames: ['amazon.com', 'prime video', 'amazon prime video']
  },
  {
    serviceName: 'HBO Max',
    cancelUrl: 'https://www.hbomax.com/subscription',
    cancelMethod: 'account',
    instructions: 'Sign in → Profile → Billing Information → Cancel Subscription',
    difficulty: 'easy',
    alternativeNames: ['hbomax.com', 'hbo max', 'max']
  },
  {
    serviceName: 'Apple TV+',
    cancelUrl: 'https://tv.apple.com/settings',
    cancelMethod: 'account',
    instructions: 'Sign in → Settings → Manage Subscription → Cancel',
    difficulty: 'easy',
    alternativeNames: ['apple tv+', 'appletv+', 'apple.com']
  },

  // Software & Productivity
  {
    serviceName: 'Adobe Creative Cloud',
    cancelUrl: 'https://account.adobe.com/plans',
    cancelMethod: 'account',
    instructions: 'Sign in → Plans → Manage Plan → Cancel Plan',
    difficulty: 'medium',
    notes: 'May have early termination fees',
    alternativeNames: ['adobe.com', 'creative cloud', 'photoshop', 'illustrator']
  },
  {
    serviceName: 'Microsoft 365',
    cancelUrl: 'https://account.microsoft.com/services/',
    cancelMethod: 'account',
    instructions: 'Sign in → Services & subscriptions → Cancel',
    difficulty: 'easy',
    alternativeNames: ['microsoft.com', 'office 365', 'outlook']
  },
  {
    serviceName: 'Notion',
    cancelUrl: 'https://www.notion.so/my-account',
    cancelMethod: 'account',
    instructions: 'Sign in → Settings → Plans → Cancel Plan',
    difficulty: 'easy',
    alternativeNames: ['notion.so']
  },
  {
    serviceName: 'Slack',
    cancelUrl: 'https://slack.com/billing',
    cancelMethod: 'account',
    instructions: 'Sign in → Billing → Cancel plan (workspace admins only)',
    difficulty: 'easy',
    alternativeNames: ['slack.com']
  },
  {
    serviceName: 'Zoom',
    cancelUrl: 'https://zoom.us/billing',
    cancelMethod: 'account',
    instructions: 'Sign in → Billing → Cancel Subscription',
    difficulty: 'easy',
    alternativeNames: ['zoom.us']
  },
  {
    serviceName: 'Dropbox',
    cancelUrl: 'https://www.dropbox.com/account/plan',
    cancelMethod: 'account',
    instructions: 'Sign in → Account → Plan → Cancel plan',
    difficulty: 'easy',
    alternativeNames: ['dropbox.com']
  },
  {
    serviceName: 'Google Workspace',
    cancelUrl: 'https://admin.google.com/ac/billing/subscriptions',
    cancelMethod: 'account',
    instructions: 'Admin Console → Billing → Cancel subscription (admins only)',
    difficulty: 'medium',
    alternativeNames: ['google.com', 'gmail', 'workspace', 'g suite']
  },

  // Design & Creative
  {
    serviceName: 'Canva',
    cancelUrl: 'https://www.canva.com/settings/billing-purchasing/',
    cancelMethod: 'account',
    instructions: 'Sign in → Account settings → Billing & purchasing → Cancel subscription',
    difficulty: 'easy',
    alternativeNames: ['canva.com']
  },
  {
    serviceName: 'Figma',
    cancelUrl: 'https://www.figma.com/settings/billing',
    cancelMethod: 'account',
    instructions: 'Sign in → Settings → Billing → Cancel plan',
    difficulty: 'easy',
    alternativeNames: ['figma.com']
  },

  // Cloud Storage
  {
    serviceName: 'iCloud+',
    cancelMethod: 'app',
    instructions: 'Settings → [Your Name] → iCloud → Manage Storage → Change Storage Plan → Downgrade Options',
    difficulty: 'medium',
    alternativeNames: ['icloud', 'apple icloud', 'icloud storage']
  },
  {
    serviceName: 'Google One',
    cancelUrl: 'https://one.google.com/settings',
    cancelMethod: 'account',
    instructions: 'Sign in → Settings → Cancel membership',
    difficulty: 'easy',
    alternativeNames: ['google one', 'google drive storage']
  },

  // Fitness & Health
  {
    serviceName: 'Peloton',
    cancelUrl: 'https://www.onepeloton.com/digital/checkout/digital-cancel',
    cancelMethod: 'account',
    instructions: 'Sign in → Account Settings → Membership → Cancel Digital Membership',
    difficulty: 'medium',
    alternativeNames: ['peloton.com']
  },
  {
    serviceName: 'MyFitnessPal',
    cancelUrl: 'https://www.myfitnesspal.com/account/privacy_settings',
    cancelMethod: 'account',
    instructions: 'Sign in → Settings → Cancel Premium',
    difficulty: 'easy',
    alternativeNames: ['myfitnesspal.com']
  },

  // News & Media
  {
    serviceName: 'The New York Times',
    cancelMethod: 'phone',
    instructions: 'Call 1-800-NYTIMES (1-800-698-4637) or chat online',
    difficulty: 'hard',
    notes: 'Requires phone call or chat - cannot cancel online easily',
    alternativeNames: ['nytimes.com', 'new york times', 'nyt']
  },
  {
    serviceName: 'Wall Street Journal',
    cancelMethod: 'phone',
    instructions: 'Call 1-800-JOURNAL (1-800-568-7625)',
    difficulty: 'hard',
    notes: 'Requires phone call',
    alternativeNames: ['wsj.com', 'wall street journal']
  },

  // Gaming
  {
    serviceName: 'PlayStation Plus',
    cancelUrl: 'https://www.playstation.com/en-us/support/subscriptions/cancel-playstation-plus/',
    cancelMethod: 'account',
    instructions: 'PlayStation Store → Settings → Account Management → Account Information → PlayStation Subscriptions',
    difficulty: 'medium',
    alternativeNames: ['playstation plus', 'ps plus', 'sony']
  },
  {
    serviceName: 'Xbox Game Pass',
    cancelUrl: 'https://account.microsoft.com/services/',
    cancelMethod: 'account',
    instructions: 'Microsoft Account → Services & subscriptions → Xbox Game Pass → Cancel',
    difficulty: 'easy',
    alternativeNames: ['xbox game pass', 'gamepass', 'microsoft']
  },

  // Professional Services
  {
    serviceName: 'LinkedIn Premium',
    cancelUrl: 'https://www.linkedin.com/premium/manage/',
    cancelMethod: 'account',
    instructions: 'Sign in → Premium → Manage premium account → Cancel premium',
    difficulty: 'easy',
    alternativeNames: ['linkedin.com']
  },

  // VPN Services
  {
    serviceName: 'NordVPN',
    cancelMethod: 'email',
    instructions: 'Email support@nordvpn.com or use live chat to request cancellation',
    difficulty: 'medium',
    alternativeNames: ['nordvpn.com']
  },
  {
    serviceName: 'ExpressVPN',
    cancelMethod: 'email',
    instructions: 'Email support@expressvpn.com or use live chat',
    difficulty: 'medium',
    alternativeNames: ['expressvpn.com']
  }
]

/**
 * Find cancellation info for a service
 */
export function findCancellationInfo(serviceName: string): CancellationInfo | null {
  const searchTerm = serviceName.toLowerCase().trim()
  
  return CANCELLATION_DATABASE.find(service => {
    const mainName = service.serviceName.toLowerCase()
    const alternatives = service.alternativeNames?.map(name => name.toLowerCase()) || []
    
    return mainName.includes(searchTerm) || 
           searchTerm.includes(mainName) ||
           alternatives.some(alt => alt.includes(searchTerm) || searchTerm.includes(alt))
  }) || null
}

/**
 * Get difficulty color for UI
 */
export function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
    case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
    case 'hard': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

/**
 * Get method icon
 */
export function getMethodIcon(method: string): string {
  switch (method) {
    case 'url': return '🌐'
    case 'account': return '👤'
    case 'phone': return '📞'
    case 'email': return '📧'
    case 'app': return '📱'
    default: return '❓'
  }
} 
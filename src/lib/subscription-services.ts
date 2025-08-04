export interface SubscriptionService {
  name: string
  category: string
  defaultFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  defaultAmount?: number
  icon?: string
  website?: string
}

export const POPULAR_SUBSCRIPTION_SERVICES: SubscriptionService[] = [
  // Streaming & Entertainment
  { name: 'Netflix', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 15.99, icon: '🎬' },
  { name: 'Disney+', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 7.99, icon: '🏰' },
  { name: 'Hulu', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 7.99, icon: '📺' },
  { name: 'HBO Max', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 15.99, icon: '🎭' },
  { name: 'Amazon Prime', category: 'Entertainment', defaultFrequency: 'yearly', defaultAmount: 139, icon: '📦' },
  { name: 'Apple TV+', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🍎' },
  { name: 'Peacock', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 5.99, icon: '🦚' },
  { name: 'Paramount+', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 4.99, icon: '🎬' },
  { name: 'Crunchyroll', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 7.99, icon: '🍙' },
  { name: 'Funimation', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 5.99, icon: '🎌' },

  // Music & Audio
  { name: 'Spotify', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🎵' },
  { name: 'Apple Music', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🎵' },
  { name: 'YouTube Music', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🎵' },
  { name: 'Amazon Music', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 8.99, icon: '🎵' },
  { name: 'Tidal', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🌊' },
  { name: 'Pandora', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 4.99, icon: '📻' },
  { name: 'Audible', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 14.95, icon: '📚' },

  // Productivity & Software
  { name: 'Notion', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 8, icon: '📝' },
  { name: 'Figma', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 12, icon: '🎨' },
  { name: 'Slack', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 7.25, icon: '💬' },
  { name: 'Zoom', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 14.99, icon: '📹' },
  { name: 'Microsoft 365', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 6.99, icon: '💻' },
  { name: 'Google Workspace', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 6, icon: '🔍' },
  { name: 'Adobe Creative Cloud', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 52.99, icon: '🎨' },
  { name: 'Canva Pro', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 12.99, icon: '🎨' },
  { name: 'Airtable', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 10, icon: '📊' },
  { name: 'Asana', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 10.99, icon: '📋' },
  { name: 'Trello', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 5, icon: '📋' },
  { name: 'Monday.com', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 8, icon: '📅' },
  { name: 'ClickUp', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 5, icon: '📋' },
  { name: 'Linear', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 8, icon: '📈' },
  { name: 'Figma Dev Mode', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 4, icon: '🔧' },

  // Development & Tech
  { name: 'GitHub Pro', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 4, icon: '🐙' },
  { name: 'GitHub Copilot', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 10, icon: '🤖' },
  { name: 'JetBrains', category: 'Technology', defaultFrequency: 'yearly', defaultAmount: 199, icon: '💻' },
  { name: 'VS Code Pro', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 9, icon: '💻' },
  { name: 'Vercel Pro', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 20, icon: '▲' },
  { name: 'Netlify Pro', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 19, icon: '🌐' },
  { name: 'Heroku', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 7, icon: '☁️' },
  { name: 'DigitalOcean', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 5, icon: '🐙' },
  { name: 'AWS', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 0, icon: '☁️' },
  { name: 'Google Cloud', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 0, icon: '☁️' },
  { name: 'MongoDB Atlas', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 9, icon: '🍃' },
  { name: 'PostgreSQL', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🐘' },
  { name: 'Redis Cloud', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 5, icon: '🔴' },

  // Storage & Cloud
  { name: 'Dropbox', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '📁' },
  { name: 'Google Drive', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 1.99, icon: '☁️' },
  { name: 'OneDrive', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 1.99, icon: '☁️' },
  { name: 'iCloud', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 0.99, icon: '☁️' },
  { name: 'Box', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 5, icon: '📦' },

  // AI & Machine Learning
  { name: 'ChatGPT Plus', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 20, icon: '🤖' },
  { name: 'Claude Pro', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 20, icon: '🤖' },
  { name: 'Midjourney', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 10, icon: '🎨' },
  { name: 'DALL-E', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 20, icon: '🎨' },
  { name: 'Stable Diffusion', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 10, icon: '🎨' },
  { name: 'Anthropic Claude', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 20, icon: '🤖' },
  { name: 'Jasper', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 39, icon: '✍️' },
  { name: 'Copy.ai', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 36, icon: '✍️' },
  { name: 'Grammarly Premium', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 12, icon: '✍️' },

  // Gaming
  { name: 'Xbox Game Pass', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 14.99, icon: '🎮' },
  { name: 'PlayStation Plus', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🎮' },
  { name: 'Nintendo Switch Online', category: 'Entertainment', defaultFrequency: 'yearly', defaultAmount: 19.99, icon: '🎮' },
  { name: 'Steam', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🎮' },
  { name: 'Epic Games', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🎮' },
  { name: 'Twitch Prime', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 12.99, icon: '📺' },

  // Fitness & Health
  { name: 'Peloton', category: 'Health', defaultFrequency: 'monthly', defaultAmount: 12.99, icon: '🚴' },
  { name: 'MyFitnessPal', category: 'Health', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🍎' },
  { name: 'Noom', category: 'Health', defaultFrequency: 'monthly', defaultAmount: 59, icon: '🎯' },
  { name: 'Headspace', category: 'Health', defaultFrequency: 'monthly', defaultAmount: 12.99, icon: '🧘' },
  { name: 'Calm', category: 'Health', defaultFrequency: 'monthly', defaultAmount: 14.99, icon: '🌊' },
  { name: 'Fitbit Premium', category: 'Health', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '⌚' },
  { name: 'Strava', category: 'Health', defaultFrequency: 'monthly', defaultAmount: 5.99, icon: '🏃' },

  // Shopping & Retail
  { name: 'Amazon Prime', category: 'Shopping', defaultFrequency: 'yearly', defaultAmount: 139, icon: '📦' },
  { name: 'Costco', category: 'Shopping', defaultFrequency: 'yearly', defaultAmount: 60, icon: '🛒' },
  { name: 'Sam\'s Club', category: 'Shopping', defaultFrequency: 'yearly', defaultAmount: 45, icon: '🛒' },
  { name: 'Walmart+', category: 'Shopping', defaultFrequency: 'monthly', defaultAmount: 12.95, icon: '🛒' },
  { name: 'Target Circle', category: 'Shopping', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🎯' },

  // Food & Delivery
  { name: 'DoorDash DashPass', category: 'Food', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🍕' },
  { name: 'Uber Eats Pass', category: 'Food', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🍔' },
  { name: 'Instacart Express', category: 'Food', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '🛒' },
  { name: 'HelloFresh', category: 'Food', defaultFrequency: 'weekly', defaultAmount: 8.99, icon: '🥗' },
  { name: 'Blue Apron', category: 'Food', defaultFrequency: 'weekly', defaultAmount: 9.99, icon: '🥗' },
  { name: 'Stitch Fix', category: 'Shopping', defaultFrequency: 'monthly', defaultAmount: 20, icon: '👕' },

  // Finance & Business
  { name: 'Mint', category: 'Finance', defaultFrequency: 'monthly', defaultAmount: 0, icon: '💰' },
  { name: 'YNAB', category: 'Finance', defaultFrequency: 'monthly', defaultAmount: 11.99, icon: '💰' },
  { name: 'Personal Capital', category: 'Finance', defaultFrequency: 'monthly', defaultAmount: 0, icon: '💰' },
  { name: 'QuickBooks', category: 'Finance', defaultFrequency: 'monthly', defaultAmount: 25, icon: '📊' },
  { name: 'FreshBooks', category: 'Finance', defaultFrequency: 'monthly', defaultAmount: 15, icon: '📊' },
  { name: 'Xero', category: 'Finance', defaultFrequency: 'monthly', defaultAmount: 11, icon: '📊' },
  { name: 'Stripe', category: 'Finance', defaultFrequency: 'monthly', defaultAmount: 0, icon: '💳' },
  { name: 'PayPal', category: 'Finance', defaultFrequency: 'monthly', defaultAmount: 0, icon: '💳' },

  // Education & Learning
  { name: 'Coursera Plus', category: 'Education', defaultFrequency: 'monthly', defaultAmount: 59, icon: '📚' },
  { name: 'Udemy', category: 'Education', defaultFrequency: 'monthly', defaultAmount: 16.58, icon: '📚' },
  { name: 'Skillshare', category: 'Education', defaultFrequency: 'monthly', defaultAmount: 13.99, icon: '📚' },
  { name: 'MasterClass', category: 'Education', defaultFrequency: 'yearly', defaultAmount: 180, icon: '📚' },
  { name: 'Duolingo Plus', category: 'Education', defaultFrequency: 'monthly', defaultAmount: 6.99, icon: '🗣️' },
  { name: 'Babbel', category: 'Education', defaultFrequency: 'monthly', defaultAmount: 13.95, icon: '🗣️' },
  { name: 'Rosetta Stone', category: 'Education', defaultFrequency: 'monthly', defaultAmount: 11.99, icon: '🗣️' },

  // Security & VPN
  { name: 'NordVPN', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 11.99, icon: '🔒' },
  { name: 'ExpressVPN', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 12.95, icon: '🔒' },
  { name: 'Surfshark', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 12.95, icon: '🔒' },
  { name: '1Password', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 2.99, icon: '🔐' },
  { name: 'LastPass', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 3, icon: '🔐' },
  { name: 'Dashlane', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 3.33, icon: '🔐' },
  { name: 'Bitwarden', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🔐' },

  // Communication
  { name: 'Discord Nitro', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '💬' },
  { name: 'Telegram Premium', category: 'Communication', defaultFrequency: 'monthly', defaultAmount: 4.99, icon: '📱' },
  { name: 'WhatsApp Business', category: 'Communication', defaultFrequency: 'monthly', defaultAmount: 0, icon: '📱' },
  { name: 'Skype', category: 'Communication', defaultFrequency: 'monthly', defaultAmount: 0, icon: '📞' },

  // Photography & Video
  { name: 'Lightroom', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '📸' },
  { name: 'VSCO', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 19.99, icon: '📸' },
  { name: 'Snapseed', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 0, icon: '📸' },
  { name: 'CapCut', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🎬' },
  { name: 'DaVinci Resolve', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🎬' },

  // Other Popular Services
  { name: 'Tinder Plus', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 9.99, icon: '💕' },
  { name: 'Bumble Premium', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 24.99, icon: '💕' },
  { name: 'LinkedIn Premium', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 29.99, icon: '💼' },
  { name: 'Indeed', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 0, icon: '💼' },
  { name: 'Glassdoor', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 0, icon: '💼' },
  { name: 'Zillow', category: 'Shopping', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🏠' },
  { name: 'Redfin', category: 'Shopping', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🏠' },
  { name: 'Realtor.com', category: 'Shopping', defaultFrequency: 'monthly', defaultAmount: 0, icon: '🏠' },

  // Additional Requested Services
  { name: 'YouTube Premium', category: 'Entertainment', defaultFrequency: 'monthly', defaultAmount: 11.99, icon: '📺' },
  { name: 'Duolingo', category: 'Education', defaultFrequency: 'monthly', defaultAmount: 6.99, icon: '🗣️' },
  { name: 'ChatGPT', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 20, icon: '🤖' },
  { name: 'Notion AI', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 10, icon: '🤖' },
  { name: 'Grammarly', category: 'Technology', defaultFrequency: 'monthly', defaultAmount: 12, icon: '✍️' },
  { name: 'Canva Pro', category: 'Productivity', defaultFrequency: 'monthly', defaultAmount: 12.99, icon: '🎨' },
]

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const CATEGORY_OPTIONS = [
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Productivity', label: 'Productivity' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Health', label: 'Health' },
  { value: 'Education', label: 'Education' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Food', label: 'Food' },
  { value: 'Communication', label: 'Communication' },
  { value: 'Other', label: 'Other' },
]

export function findServiceByName(name: string): SubscriptionService | undefined {
  return POPULAR_SUBSCRIPTION_SERVICES.find(
    service => service.name.toLowerCase() === name.toLowerCase()
  )
}

export function searchServices(query: string): SubscriptionService[] {
  if (!query.trim()) return []
  
  const lowercaseQuery = query.toLowerCase()
  return POPULAR_SUBSCRIPTION_SERVICES.filter(service =>
    service.name.toLowerCase().includes(lowercaseQuery) ||
    service.category.toLowerCase().includes(lowercaseQuery)
  ).slice(0, 10) // Limit to 10 results
}

export function calculateNextRenewalDate(startDate: string, frequency: string): string {
  const date = new Date(startDate)
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
    default:
      date.setMonth(date.getMonth() + 1) // Default to monthly
  }
  
  return date.toISOString().split('T')[0]
} 
# Sentinel - Privacy-First Subscription Management

Sentinel is a privacy-first app that helps users track and manage free trials and subscriptions without requiring access to financial data. Built with Next.js, TypeScript, and Supabase.

## 🚀 Features

### Core Features (MVP)
- **Gmail OAuth Login** - Secure authentication with Google
- **AI-Powered Email Parsing** - Automatically detect trials and subscriptions from emails
- **Privacy-First Design** - No access to financial data, local processing when possible
- **Clean, Modern UI** - Soft colors, rounded corners, and clear typography
- **Dashboard Overview** - Track subscriptions, trials, and spending
- **Smart Notifications** - Get reminders for trial endings and renewals

### Planned Features
- Calendar sync (Google Calendar)
- Multi-channel notifications (email + push)
- One-click cancellation for supported services
- Usage tracking and analytics
- Personalized suggestions for alternatives
- Gamified rewards for saving money

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI + custom components
- **Backend**: Supabase (Auth, Database, Real-time)
- **AI**: OpenAI API for email parsing
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sentinel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env

   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Enable Google OAuth in Authentication settings
   - Create the database tables (see Database Schema below)
   - Copy your project URL and keys to `.env.local`

5. **Set up Google OAuth**
   - Go to Google Cloud Console
   - Create a new project or select existing
   - Enable Gmail API and Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.com/auth/callback`

6. **Set up OpenAI API**
   - Create an OpenAI account
   - Generate an API key
   - Add to `.env.local`

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service TEXT NOT NULL,
  type TEXT CHECK (type IN ('trial', 'subscription')),
  status TEXT CHECK (status IN ('active', 'expired', 'cancelled')),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly', 'daily')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  trial_end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  category TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('trial_ending', 'renewal_reminder', 'payment_failed', 'price_change')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
sentinel/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   ├── dashboard/          # Main dashboard
│   │   ├── api/               # API routes
│   │   └── globals.css
│   ├── components/             # Reusable components
│   │   ├── ui/                # Base UI components
│   │   ├── auth/              # Auth components
│   │   ├── dashboard/          # Dashboard components
│   │   └── notifications/      # Notification components
│   ├── lib/                   # Utilities and configs
│   │   ├── supabase.ts        # Supabase client
│   │   ├── auth.ts            # Auth utilities
│   │   ├── email-parser.ts    # AI email parsing
│   │   └── utils.ts
│   ├── types/                 # TypeScript types
│   └── hooks/                 # Custom React hooks
├── public/
└── package.json
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3B82F6) to Indigo (#6366F1) gradient
- **Background**: Soft blue gradient (#EFF6FF to #F8FAFC)
- **Text**: Dark gray (#1F2937)
- **Accent**: Soft grays and blues

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700
- **Sizes**: 12px, 14px, 16px, 18px, 24px, 32px, 48px

### Components
- **Cards**: Rounded corners, soft shadows, glass effect
- **Buttons**: Rounded, with hover states
- **Badges**: Color-coded status indicators
- **Navigation**: Clean, minimal design

## 🔒 Privacy Features

- **No Financial Data Access**: We don't connect to bank accounts or credit cards
- **Local Processing**: Email parsing happens locally when possible
- **Minimal Data Storage**: Only essential subscription information
- **Encrypted Storage**: All data encrypted at rest
- **GDPR Compliant**: Built with privacy regulations in mind

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.sentinel.com](https://docs.sentinel.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/sentinel/issues)
- **Discord**: [Join our community](https://discord.gg/sentinel)

## 🗺️ Roadmap

### Phase 1 (Current - MVP)
- [x] Gmail OAuth login
- [x] Basic dashboard
- [x] AI email parsing
- [x] Privacy-focused design

### Phase 2 (Next)
- [ ] Calendar sync
- [ ] Push notifications
- [ ] Advanced email parsing
- [ ] Subscription analytics

### Phase 3 (Future)
- [ ] One-click cancellations
- [ ] Alternative suggestions
- [ ] Gamification system
- [ ] Mobile app

---

Built with ❤️ by the Sentinel team

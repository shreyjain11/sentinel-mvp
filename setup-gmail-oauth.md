# Gmail OAuth Setup Guide

This guide will help you set up Gmail OAuth integration for Sentinel to access and parse user emails for subscription detection.

## Step 1: Set up Google Cloud Console

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project** (or select existing one)
3. **Enable Gmail API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Name: "Sentinel Gmail Integration"
   - **Authorized redirect URIs**:
     - For development: `http://localhost:3000/auth/gmail/callback`
     - For production: `https://yourdomain.com/auth/gmail/callback`

5. **Download the credentials** and note the Client ID and Client Secret

## Step 2: Environment Variables

Add these to your `.env.local` file:

```env
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gmail OAuth (Required for Gmail integration)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: OpenAI API for AI-powered email parsing (Step 3)
OPENAI_API_KEY=your_openai_api_key
```

**Important**: 
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is public (used in frontend)
- `GOOGLE_CLIENT_SECRET` must be kept secret (server-side only)

## Step 3: Database Setup

Run this SQL in your Supabase dashboard to create the Gmail tokens table:

```sql
-- Create gmail_tokens table (run gmail-tokens-schema.sql)
```

## Step 4: Test the Integration

1. **Start your development server**: `npm run dev`
2. **Sign in to your app**
3. **Go to Dashboard**
4. **Click "Connect Gmail"** - this should:
   - Redirect to Google OAuth consent screen
   - Ask for Gmail read-only permission
   - Redirect back to your app
   - Store tokens securely in Supabase

## Step 5: Verify Connection

The app will:
- ✅ Store OAuth tokens securely in Supabase
- ✅ Fetch emails with subscription-related keywords
- ✅ Parse email content (AI parsing coming in next step)
- ✅ Display found subscriptions in dashboard

## Security Features

- **Read-only Gmail access** - Can only read emails, never send or modify
- **Encrypted token storage** - Tokens stored securely in Supabase
- **Automatic token refresh** - Handles expired tokens automatically
- **User consent required** - Users must explicitly grant permission

## Troubleshooting

### "Google Client ID not configured"
- Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart your development server after adding environment variables

### "Redirect URI mismatch"
- Ensure the redirect URI in Google Cloud Console matches exactly:
  - Development: `http://localhost:3000/auth/gmail/callback`
  - Production: `https://yourdomain.com/auth/gmail/callback`

### "OAuth error: access_denied"
- User denied permission - they need to grant Gmail read access
- Try the flow again

### "No valid Gmail access token"
- Token may have expired - the app should automatically refresh
- Check browser console for detailed error messages

## Next Steps

Once Gmail OAuth is working:
1. **Implement AI email parsing** with OpenAI (Step 3 of roadmap)
2. **Store parsed subscriptions** in database (Step 4)
3. **Add duplicate detection** and confidence scoring (Step 5)
4. **Build debug UI** for testing (Step 6)

## Email Query Examples

The app searches for emails using this query:
```
subject:(trial OR subscription OR confirm OR welcome OR billing OR payment OR renewal OR upgrade OR premium OR pro OR plan OR membership) newer_than:30d
```

This finds emails from the last 30 days containing subscription-related keywords in the subject line. 
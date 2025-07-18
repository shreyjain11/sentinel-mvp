# Setting Up Google OAuth for Sentinel

## Prerequisites
- A Google Cloud Console account
- Your Supabase project

## Step 1: Set up Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click on it and press "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - Copy your Client ID and Client Secret

## Step 2: Configure Supabase

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Providers
3. Find Google in the list and enable it
4. Add your Google OAuth credentials:
   - **Client ID**: (paste from Google Cloud Console)
   - **Client Secret**: (paste from Google Cloud Console)
5. Add the following authorized scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```

## Step 3: Update your .env.local

Make sure your `.env.local` file has the correct Supabase URL and anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/auth`
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorizing, you'll be redirected back to your dashboard

## Troubleshooting

### "Auth session missing" Error
This usually means:
1. The user isn't properly authenticated
2. The session has expired
3. There's a mismatch between your Supabase URL/keys

### Google OAuth Not Working
1. Make sure you've enabled the Google provider in Supabase
2. Check that your redirect URI matches exactly
3. Ensure your Client ID and Secret are correct
4. Check the browser console for specific error messages

### Database Errors
1. Make sure you've run the database schema (see setup-database.md)
2. Check that RLS policies are properly set up
3. Verify that the user has the correct permissions

## Important Notes

- For production, update the redirect URI to your production domain
- Keep your Client Secret secure and never commit it to version control
- The Gmail API has usage limits - be mindful in production 
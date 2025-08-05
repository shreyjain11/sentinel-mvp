# 🚀 Production Setup Guide - Email Sending

## **Current Issue:** "Email service not configured"

This guide will get your email sending working in production.

## **Step 1: Gmail App Password Setup**

### 1.1 Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/
2. Sign in with `contactsentinelai@gmail.com`
3. Go to "Security" tab
4. Click "2-Step Verification"
5. Enable it if not already enabled

### 1.2 Generate App Password
1. Go to "Security" > "App passwords"
2. Select "Mail" as the app
3. Select "Other" as device
4. Enter "Sentinel" as the name
5. Click "Generate"
6. **Copy the 16-character password** (you'll only see it once!)

## **Step 2: Environment Variables**

### 2.1 Create .env.local file
Create a file called `.env.local` in your `sentinel` directory:

```bash
cd sentinel
touch .env.local
```

### 2.2 Add Required Variables
Add these to your `.env.local` file:

```env
# Supabase Configuration (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gmail SMTP Configuration (REQUIRED - this fixes the error)
GMAIL_APP_PASSWORD=your_16_character_app_password_from_step_1

# Email Configuration
SENTINEL_EMAIL_FROM=contactsentinelai@gmail.com
SENTINEL_EMAIL_NAME=Sentinel

# Optional: Google OAuth (for Gmail integration)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Optional: OpenAI API (for AI email parsing)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Twilio (for SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

**Important:** Replace `your_16_character_app_password_from_step_1` with the actual 16-character password you got from Step 1.2.

## **Step 3: Database Setup**

### 3.1 Create Email Logs Table
1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `email-logs-schema.sql`
4. Click "Run" to execute the SQL

### 3.2 Verify Table Creation
1. Go to "Table Editor" in Supabase
2. You should see a new `email_logs` table
3. Verify it has the correct columns

## **Step 4: Test Email Sending**

### 4.1 Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### 4.2 Test Email Functionality
1. Go to http://localhost:3000
2. Sign in to your app
3. Go to "Notifications" page
4. Click the test button next to "Email Notifications"
5. Check your email inbox for a test email from `contactsentinelai@gmail.com`

## **Step 5: Verify Everything Works**

### 5.1 Check Email Logs
1. Go to Supabase dashboard > "Table Editor" > "email_logs"
2. You should see entries for sent emails

### 5.2 Test Different Email Types
The system supports:
- Test notifications
- Trial ending alerts
- Renewal reminders
- Price change notifications

## **Troubleshooting**

### Issue: Still getting "Email service not configured"
**Solutions:**
1. Make sure `.env.local` file exists in the `sentinel` directory
2. Verify `GMAIL_APP_PASSWORD` is set correctly
3. Restart the development server after adding environment variables
4. Check that the app password is exactly 16 characters

### Issue: "Authentication failed"
**Solutions:**
1. Verify 2-Factor Authentication is enabled on Gmail
2. Generate a new app password
3. Make sure you're using the app password, not your regular password

### Issue: Emails not being sent
**Solutions:**
1. Check browser console for errors
2. Check server logs for authentication errors
3. Verify the Gmail account has SMTP access enabled

## **Production Deployment**

### For Vercel Deployment:
1. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add `GMAIL_APP_PASSWORD` with your app password
   - Add other required environment variables

### For Other Platforms:
1. Add environment variables to your hosting platform
2. Make sure `GMAIL_APP_PASSWORD` is set
3. Deploy and test email functionality

## **Security Notes**

1. **Never commit `.env.local` to version control**
2. **Use app passwords, not regular passwords**
3. **Rotate app passwords regularly**
4. **Monitor email sending logs**

## **Next Steps After Setup**

1. **Customize email templates** to match your branding
2. **Set up email analytics** to track open rates
3. **Configure email preferences** for users
4. **Set up monitoring** for failed sends
5. **Consider email service migration** for high volume

## **Verification Checklist**

- [ ] Gmail 2-Factor Authentication enabled
- [ ] App password generated (16 characters)
- [ ] `.env.local` file created with `GMAIL_APP_PASSWORD`
- [ ] Development server restarted
- [ ] Email logs table created in Supabase
- [ ] Test email sent successfully
- [ ] Email logs populated in database
- [ ] No more "Email service not configured" errors

Once you complete these steps, your email sending will be **production-ready** and users will receive beautiful emails from `contactsentinelai@gmail.com`! 
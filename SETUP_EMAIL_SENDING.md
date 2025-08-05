# Email Sending Setup Guide

This guide will help you set up Gmail SMTP for sending emails from `contactsentinelai@gmail.com` to users.

## Step 1: Gmail Account Setup

### 1.1 Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to "Security" > "2-Step Verification"
3. Enable 2-Step Verification if not already enabled

### 1.2 Generate App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to "Security" > "App passwords"
3. Select "Mail" as the app and "Other" as the device
4. Enter "Sentinel" as the name
5. Click "Generate"
6. **Copy the 16-character app password** (you'll only see it once!)

## Step 2: Environment Variables

Add these to your `.env.local` file:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gmail SMTP Configuration
GMAIL_APP_PASSWORD=your_16_character_app_password_here

# Optional: Email configuration
SENTINEL_EMAIL_FROM=contactsentinelai@gmail.com
SENTINEL_EMAIL_NAME=Sentinel
```

**Important Notes:**
- `GMAIL_APP_PASSWORD` is the 16-character app password from Step 1.2
- Never use your regular Gmail password
- The app password is secure and can be revoked if needed

## Step 3: Database Setup

Run this SQL in your Supabase dashboard to create the email logs table:

```sql
-- Copy and paste the contents of email-logs-schema.sql
```

## Step 4: Test Email Sending

1. **Start your development server**: `npm run dev`
2. **Sign in to your app**
3. **Go to Notifications page**
4. **Click the test button next to "Email Notifications"**
5. **Check your email** - you should receive a test email from `contactsentinelai@gmail.com`

## Step 5: Verify Setup

### Check Email Logs
1. Go to your Supabase dashboard
2. Navigate to "Table Editor" > "email_logs"
3. You should see entries for sent emails

### Test Different Email Types
The system supports these email types:
- `test` - Test notifications
- `trial_ending` - Trial ending reminders
- `renewal_reminder` - Subscription renewal alerts
- `price_change` - Price change notifications

## Troubleshooting

### Issue: "Email service not configured"
**Solution:** Make sure `GMAIL_APP_PASSWORD` is set in your `.env.local`

### Issue: "Authentication failed"
**Solution:** 
1. Verify 2-Factor Authentication is enabled
2. Generate a new app password
3. Update your `.env.local` with the new password

### Issue: "Invalid credentials"
**Solution:**
1. Double-check the app password is correct
2. Make sure you're using the app password, not your regular password
3. Try generating a new app password

### Issue: Emails not being sent
**Solution:**
1. Check the browser console for errors
2. Check the server logs for authentication errors
3. Verify the Gmail account has SMTP access enabled

## Security Best Practices

1. **Never commit app passwords to version control**
2. **Use environment variables for all sensitive data**
3. **Regularly rotate app passwords**
4. **Monitor email sending logs for unusual activity**

## Production Considerations

### Rate Limiting
Gmail has sending limits:
- 500 emails per day for regular accounts
- 2000 emails per day for Google Workspace accounts

### Monitoring
- Set up alerts for failed email sends
- Monitor email delivery rates
- Track user engagement with emails

### Scaling
For high-volume email sending, consider:
- SendGrid
- Mailgun
- AWS SES
- Resend

## Email Templates

The system includes beautiful, responsive email templates for:
- Test notifications
- Trial ending alerts
- Renewal reminders
- Price change notifications

All templates are mobile-friendly and include:
- Professional branding
- Clear call-to-actions
- Unsubscribe options
- Contact information

## Next Steps

1. **Test all email types** to ensure they work correctly
2. **Customize email templates** to match your branding
3. **Set up email tracking** for analytics
4. **Configure email preferences** for users
5. **Monitor email delivery** and engagement rates

Your email sending system is now ready! Users will receive beautiful, professional emails from `contactsentinelai@gmail.com` for all their subscription notifications. 
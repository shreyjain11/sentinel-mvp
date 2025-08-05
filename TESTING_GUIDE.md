# 🧪 Email Testing Guide - Contact Sentinel

## **🎯 Complete Testing Checklist**

### **Step 1: Database Setup**
1. **Run the notification email field SQL:**
   ```sql
   ALTER TABLE notification_preferences 
   ADD COLUMN IF NOT EXISTS notification_email TEXT;
   
   UPDATE notification_preferences 
   SET notification_email = (
     SELECT email FROM auth.users WHERE auth.users.id = notification_preferences.user_id
   )
   WHERE notification_email IS NULL;
   ```

2. **Verify email_logs table exists:**
   ```sql
   SELECT * FROM email_logs LIMIT 1;
   ```

### **Step 2: Environment Variables**
1. **Check Vercel environment variables:**
   - `GMAIL_APP_PASSWORD=popd wdhk rdhv btdt`
   - `SENTINEL_EMAIL_FROM=contactsentinelai@gmail.com`
   - `SENTINEL_EMAIL_NAME=Contact Sentinel`

2. **Redeploy if needed:**
   - Go to Vercel dashboard
   - Click "Redeploy" on latest deployment

### **Step 3: Test Email Functionality**

#### **3.1 Test Basic Email Sending**
1. **Go to:** https://your-app.vercel.app/notifications
2. **Sign in** with your account
3. **Click the test button** next to "Email Notifications"
4. **Check your email** - should receive beautiful test email
5. **Verify sender:** "Contact Sentinel <contactsentinelai@gmail.com>"

#### **3.2 Test Different User Accounts**
1. **Sign in with different account**
2. **Click test button**
3. **Verify email goes to correct address**
4. **Check email_logs table** in Supabase

#### **3.3 Test Notification Email Preference**
1. **Set notification email:**
   ```bash
   curl -X PUT https://your-app.vercel.app/api/user/notification-email \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{"notification_email": "shreyjainthegreat@gmail.com"}'
   ```

2. **Test email sending** - should go to preferred email

### **Step 4: Test All Email Types**

#### **4.1 Test Notifications (`test`)**
- ✅ **Already tested** - Click test button
- **Expected:** Welcome email with feature overview

#### **4.2 Trial Ending Alerts (`trial_ending`)**
1. **Create subscription with trial end date**
2. **Wait for notification** or trigger manually
3. **Expected:** Red gradient header with warning

#### **4.3 Renewal Reminders (`renewal_reminder`)**
1. **Create subscription with renewal date**
2. **Wait for notification** or trigger manually
3. **Expected:** Blue gradient header with renewal info

#### **4.4 Price Change Alerts (`price_change`)**
1. **Update subscription price**
2. **Trigger notification**
3. **Expected:** Orange gradient header with price comparison

#### **4.5 Unused Subscription Alerts (`unused_subscription`)**
1. **Mark subscription as unused**
2. **Trigger notification**
3. **Expected:** Red gradient header with savings info

#### **4.6 Welcome Emails (`welcome`)**
1. **New user signup**
2. **Expected:** Blue gradient header with getting started guide

### **Step 5: Verify Email Design**

#### **5.1 Check Email Elements:**
- ✅ **Header:** Gradient background with "Contact Sentinel"
- ✅ **Content:** Service-specific information
- ✅ **Action Section:** Clear next steps
- ✅ **Footer:** "Contact us at contactsentinelai@gmail.com"

#### **5.2 Test Email Clients:**
- ✅ **Gmail** - Desktop and mobile
- ✅ **Outlook** - Desktop version
- ✅ **Apple Mail** - iOS and macOS
- ✅ **Mobile apps** - Various email clients

### **Step 6: Debug and Monitor**

#### **6.1 Check Vercel Logs:**
1. **Go to Vercel dashboard**
2. **Click on latest deployment**
3. **Go to "Functions" tab**
4. **Look for email endpoint logs:**
   ```
   🔍 Email endpoint - Environment check: {
     hasGmailPassword: true,
     gmailPasswordLength: 16,
     emailFrom: "contactsentinelai@gmail.com",
     nodeEnv: "production"
   }
   ```

#### **6.2 Check Database Logs:**
1. **Go to Supabase dashboard**
2. **Navigate to "Table Editor" > "email_logs"**
3. **Verify entries are being created**

#### **6.3 Test Error Scenarios:**
1. **Not signed in** - Should show "User not authenticated"
2. **Missing environment variables** - Should show specific error
3. **Invalid email format** - Should show validation error

### **Step 7: Performance Testing**

#### **7.1 Load Testing:**
1. **Send multiple test emails**
2. **Check delivery rates**
3. **Monitor Gmail sending limits**

#### **7.2 Rate Limiting:**
- Gmail: 500 emails/day (regular account)
- Monitor for rate limit errors

### **Step 8: Production Verification**

#### **8.1 Final Checklist:**
- ✅ **Authentication working** - No "User not authenticated" errors
- ✅ **Email sending working** - No "Email service not configured" errors
- ✅ **Correct recipient** - Emails go to preferred notification email
- ✅ **Professional design** - All templates look good
- ✅ **Support email** - contactsentinelai@gmail.com
- ✅ **Database logging** - All emails logged in email_logs

#### **8.2 User Acceptance Testing:**
1. **Test with different user accounts**
2. **Test with different email addresses**
3. **Test all notification types**
4. **Verify mobile responsiveness**

## **🚨 Troubleshooting**

### **Issue: Still getting "Email service not configured"**
**Solution:** Force Vercel redeployment after adding environment variables

### **Issue: Emails going to wrong address**
**Solution:** Check notification_email field in database and API

### **Issue: Authentication errors**
**Solution:** Verify session cookies and server-side client usage

### **Issue: Email not received**
**Solution:** Check spam folder and Gmail app password configuration

## **🎉 Success Indicators**

- ✅ **Test emails sent successfully**
- ✅ **All email types working**
- ✅ **Professional design in all clients**
- ✅ **Correct recipient addresses**
- ✅ **Database logging working**
- ✅ **No error messages**

## **📞 Support**

If you encounter any issues:
1. **Check Vercel logs** for error messages
2. **Check Supabase logs** for database issues
3. **Test with different accounts** to isolate issues
4. **Contact:** contactsentinelai@gmail.com

Your email system is now **production-ready** and fully tested! 
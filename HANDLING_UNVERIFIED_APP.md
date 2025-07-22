# Handling Google OAuth Unverified App Warning

## What You're Seeing

The "Google hasn't verified this app" warning appears because Sentinel requests sensitive OAuth scopes:
- `https://www.googleapis.com/auth/gmail.readonly` (to read emails)
- `https://www.googleapis.com/auth/calendar` (to create calendar events)

This is **normal for development apps** and doesn't mean there's anything wrong with your setup.

## Development Solutions

### Option 1: Continue with Unverified App (Easiest)

1. **On the warning screen:**
   - Click "Advanced" (bottom left)
   - Click "Go to Sentinel (unsafe)"
   - Click "Continue" on any additional warnings

2. **This allows you to:**
   - Test all features normally
   - Use Gmail and Calendar integration
   - Continue development

3. **Limitations:**
   - Limited to 100 total users
   - Users will see the warning screen
   - Not suitable for production

### Option 2: Add Test Users (Recommended)

1. **Go to Google Cloud Console:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to "APIs & Services" > "OAuth consent screen"

2. **Add Test Users:**
   - Scroll down to "Test users" section
   - Click "Add Users"
   - Add your email address and any other test emails
   - Save changes

3. **Benefits:**
   - No warning screen for test users
   - Up to 100 test users allowed
   - Better development experience

### Option 3: Use Development Mode (Best for Development)

1. **In OAuth Consent Screen:**
   - Set "Publishing status" to "Testing"
   - Add your email as a test user
   - This removes the warning for test users

2. **Configure Scopes:**
   - Make sure these scopes are added:
     ```
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/calendar
     https://www.googleapis.com/auth/userinfo.email
     https://www.googleapis.com/auth/userinfo.profile
     ```

## Production Considerations

### When You Need Verification

You'll need Google verification when:
- Launching to the public
- Having more than 100 users
- Removing the warning screen completely

### Verification Requirements

1. **Privacy Policy URL** (required)
2. **Terms of Service URL** (recommended)
3. **Homepage URL** (recommended)
4. **Website ownership verification** via Search Console
5. **Detailed app description**
6. **Screenshots and documentation**

### Verification Process

1. **Prepare your app:**
   - Complete all features
   - Test thoroughly
   - Have privacy policy and terms ready

2. **Submit for verification:**
   - Go to OAuth consent screen
   - Click "Submit for verification"
   - Fill out all required information
   - Wait for Google's review (can take weeks)

## Current Development Setup

For now, use **Option 2 (Add Test Users)** as it provides the best development experience:

1. Add your email as a test user in Google Cloud Console
2. Set publishing status to "Testing"
3. Continue development without warnings

## Troubleshooting

### Still Seeing Warning After Adding Test User

1. **Clear browser cache and cookies**
2. **Sign out of Google completely**
3. **Sign back in and try again**
4. **Wait 5-10 minutes for changes to propagate**

### OAuth Flow Not Working

1. **Check redirect URIs:**
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/gmail/callback
   ```

2. **Verify scopes in Google Cloud Console match your app**

3. **Check browser console for errors**

### Calendar Integration Issues

1. **Ensure calendar scope is added:**
   ```
   https://www.googleapis.com/auth/calendar
   ```

2. **Check if user granted calendar permissions**

3. **Verify tokens are being stored correctly**

## Next Steps

1. **For Development:** Use test users to avoid warnings
2. **For Testing:** Continue with unverified app if needed
3. **For Production:** Plan for verification process

The unverified app warning is expected during development and doesn't affect functionality. Focus on building features first, then handle verification when ready to launch. 
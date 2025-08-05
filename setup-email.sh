#!/bin/bash

echo "🚀 Sentinel Email Setup Script"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Creating .env.local file..."
    touch .env.local
fi

echo "📝 Please add the following to your .env.local file:"
echo ""
echo "# Gmail SMTP Configuration (REQUIRED)"
echo "GMAIL_APP_PASSWORD=your_16_character_app_password_here"
echo ""
echo "# Email Configuration"
echo "SENTINEL_EMAIL_FROM=contactsentinelai@gmail.com"
echo "SENTINEL_EMAIL_NAME=Sentinel"
echo ""

echo "🔧 To get your Gmail App Password:"
echo "1. Go to https://myaccount.google.com/"
echo "2. Sign in with contactsentinelai@gmail.com"
echo "3. Go to Security > 2-Step Verification (enable if needed)"
echo "4. Go to Security > App passwords"
echo "5. Select 'Mail' and 'Other' device"
echo "6. Enter 'Sentinel' as name"
echo "7. Copy the 16-character password"
echo ""

echo "📋 Next steps:"
echo "1. Add GMAIL_APP_PASSWORD to .env.local"
echo "2. Run the email-logs-schema.sql in Supabase"
echo "3. Restart your dev server: npm run dev"
echo "4. Test email sending on the Notifications page"
echo ""

echo "✅ Setup complete! Follow the steps above to configure email sending." 
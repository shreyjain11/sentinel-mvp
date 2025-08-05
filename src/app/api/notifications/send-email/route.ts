import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import nodemailer from 'nodemailer'

// Email templates
const emailTemplates = {
  test: {
    subject: 'Sentinel Test Notification',
    html: (userName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; text-align: center;">Sentinel</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Test Notification</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${userName || 'there'},
          </p>
          <p style="color: #666; line-height: 1.6;">
            This is a test notification from Sentinel. Your notification settings are working correctly!
          </p>
          <p style="color: #666; line-height: 1.6;">
            You'll receive notifications about:
          </p>
          <ul style="color: #666; line-height: 1.6;">
            <li>Trial ending reminders</li>
            <li>Subscription renewal alerts</li>
            <li>Price change notifications</li>
          </ul>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This email was sent from Sentinel - Your Subscription Guardian</p>
          <p>If you have any questions, please contact us at support@sentinel.com</p>
        </div>
      </div>
    `
  },
  trial_ending: {
    subject: (serviceName: string) => `Trial Ending Soon: ${serviceName}`,
    html: (userName: string, serviceName: string, daysLeft: number, endDate: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; text-align: center;">⚠️ Trial Ending Soon</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">${serviceName} Trial</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${userName || 'there'},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Your <strong>${serviceName}</strong> trial ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> on ${endDate}.
          </p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="color: #856404; margin: 0; font-weight: bold;">
              💡 Don't forget to cancel if you don't want to be charged!
            </p>
          </div>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This email was sent from Sentinel - Your Subscription Guardian</p>
        </div>
      </div>
    `
  },
  renewal_reminder: {
    subject: (serviceName: string) => `Renewal Reminder: ${serviceName}`,
    html: (userName: string, serviceName: string, amount: string, renewalDate: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; text-align: center;">🔄 Renewal Reminder</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">${serviceName} Subscription</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${userName || 'there'},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Your <strong>${serviceName}</strong> subscription will renew on <strong>${renewalDate}</strong> for <strong>${amount}</strong>.
          </p>
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="color: #0c5460; margin: 0;">
              📅 Renewal Date: ${renewalDate}<br>
              💰 Amount: ${amount}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This email was sent from Sentinel - Your Subscription Guardian</p>
        </div>
      </div>
    `
  },
  price_change: {
    subject: (serviceName: string) => `Price Change Alert: ${serviceName}`,
    html: (userName: string, serviceName: string, oldPrice: string, newPrice: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; text-align: center;">💰 Price Change Alert</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">${serviceName} Price Update</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${userName || 'there'},
          </p>
          <p style="color: #666; line-height: 1.6;">
            We detected a price change for your <strong>${serviceName}</strong> subscription.
          </p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="color: #856404; margin: 0;">
              📊 Old Price: ${oldPrice}<br>
              📈 New Price: ${newPrice}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This email was sent from Sentinel - Your Subscription Guardian</p>
        </div>
      </div>
    `
  }
}

// Create Gmail transporter
function createTransporter() {
  const gmailUser = process.env.SENTINEL_EMAIL_FROM || 'contactsentinelai@gmail.com'
  const gmailPassword = process.env.GMAIL_APP_PASSWORD
  
  if (!gmailPassword) {
    throw new Error('GMAIL_APP_PASSWORD environment variable is required')
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, type, templateData } = await request.json()

    if (!to) {
      return NextResponse.json(
        { success: false, message: 'Recipient email is required' },
        { status: 400 }
      )
    }

    // Debug environment variables
    console.log('🔍 Email endpoint - Environment check:', {
      hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
      gmailPasswordLength: process.env.GMAIL_APP_PASSWORD?.length || 0,
      emailFrom: process.env.SENTINEL_EMAIL_FROM,
      nodeEnv: process.env.NODE_ENV
    })

    // Get the authenticated user using server-side client
    const supabase = createSupabaseServerClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { success: false, message: 'Session error' },
        { status: 401 }
      )
    }
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Check if Gmail app password is configured
    if (!process.env.GMAIL_APP_PASSWORD) {
      console.error('GMAIL_APP_PASSWORD not configured in email endpoint')
      return NextResponse.json(
        { success: false, message: 'Email service not configured - GMAIL_APP_PASSWORD missing' },
        { status: 500 }
      )
    }

    // Create transporter
    const transporter = createTransporter()

    // Determine email content based on type
    let emailSubject = subject
    let emailHtml = message

    if (type && emailTemplates[type as keyof typeof emailTemplates]) {
      const template = emailTemplates[type as keyof typeof emailTemplates]
      
      if (type === 'test') {
        emailSubject = template.subject
        emailHtml = template.html(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User')
      } else if (type === 'trial_ending' && templateData) {
        emailSubject = typeof template.subject === 'function' 
          ? template.subject(templateData.serviceName)
          : template.subject
        emailHtml = typeof template.html === 'function'
          ? template.html(
              session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              templateData.serviceName,
              templateData.daysLeft,
              templateData.endDate
            )
          : template.html
      } else if (type === 'renewal_reminder' && templateData) {
        emailSubject = typeof template.subject === 'function'
          ? template.subject(templateData.serviceName)
          : template.subject
        emailHtml = typeof template.html === 'function'
          ? template.html(
              session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              templateData.serviceName,
              templateData.amount,
              templateData.renewalDate
            )
          : template.html
      } else if (type === 'price_change' && templateData) {
        emailSubject = typeof template.subject === 'function'
          ? template.subject(templateData.serviceName)
          : template.subject
        emailHtml = typeof template.html === 'function'
          ? template.html(
              session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              templateData.serviceName,
              templateData.oldPrice,
              templateData.newPrice
            )
          : template.html
      }
    }

    // Send email
    const mailOptions = {
      from: '"Contact Sentinel" <contactsentinelai@gmail.com>',
      to: to,
      subject: emailSubject,
      html: emailHtml,
      text: emailHtml.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    console.log(`📧 Sending email to ${to}: ${emailSubject}`)
    
    const info = await transporter.sendMail(mailOptions)
    
    console.log(`✅ Email sent successfully: ${info.messageId}`)

    // Log email sending in database for tracking
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: session.user.id,
          recipient: to,
          subject: emailSubject,
          type: type || 'custom',
          sent_at: new Date().toISOString(),
          message_id: info.messageId
        })
    } catch (logError) {
      console.warn('Failed to log email to database:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    )
  }
} 
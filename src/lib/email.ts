import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const APP_NAME = 'GrowthTube'

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`

  console.log('=== SENDING VERIFICATION EMAIL ===')
  console.log('To:', email)
  console.log('From:', EMAIL_FROM)
  console.log('Verification URL:', verificationUrl)
  console.log('API Key exists:', !!process.env.RESEND_API_KEY)

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Verify your email for ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #e53935; margin: 0;">${APP_NAME}</h1>
            </div>
            
            <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #333;">Verify your email address</h2>
              <p style="color: #666;">Thanks for signing up for ${APP_NAME}! Please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #e53935; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
              <p style="color: #e53935; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account with ${APP_NAME}, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send verification email:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw new Error('Failed to send verification email')
    }

    console.log('Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw error
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Reset your password for ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #e53935; margin: 0;">${APP_NAME}</h1>
            </div>
            
            <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #333;">Reset your password</h2>
              <p style="color: #666;">We received a request to reset your password. Click the button below to choose a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #e53935; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
              <p style="color: #e53935; word-break: break-all; font-size: 14px;">${resetUrl}</p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send password reset email:', error)
      throw new Error('Failed to send password reset email')
    }

    return data
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error
  }
}

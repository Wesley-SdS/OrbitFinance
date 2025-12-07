import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.SMTP_FROM || "OrbiFinance <noreply@orbifinance.com>",
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Email sending failed:", error)
      throw new Error("Failed to send email")
    }

    return data
  } catch (error) {
    console.error("Email error:", error)
    throw error
  }
}

export function getVerificationEmailTemplate(verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">OrbiFinance</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Verify your email</h2>
          <p style="color: #4b5563; font-size: 16px;">
            Thank you for signing up! Please verify your email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Verify Email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            This link will expire in 24 hours.
          </p>
        </div>
      </body>
    </html>
  `
}

export function getPasswordResetEmailTemplate(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">OrbiFinance</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Reset your password</h2>
          <p style="color: #4b5563; font-size: 16px;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            This link will expire in 1 hour.
          </p>
        </div>
      </body>
    </html>
  `
}

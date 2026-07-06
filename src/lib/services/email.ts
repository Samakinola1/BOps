import fs from 'fs';
import path from 'path';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { to, subject, text, html } = payload;

  // Provision for real email services (Resend API)
  if (process.env.RESEND_API_KEY) {
    console.log(`[Email Service] RESEND_API_KEY detected. Sending email to ${to} using Resend HTTP API.`);
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: subject,
          text: text,
          html: html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Email Service] Resend API returned error status: ${response.status} - ${errorText}`);
      } else {
        const responseData = await response.json();
        console.log(`[Email Service] Email sent successfully via Resend. ID: ${responseData.id}`);
        return true;
      }
    } catch (err) {
      console.error('[Email Service] Error invoking Resend API:', err);
    }
  }

  // Mock implementation: console log
  console.log('========================================');
  console.log(`MOCK EMAIL SENT TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`TEXT CONTENT:\n${text}`);
  console.log('========================================');

  // Save mocks to a local logs file so they can be reviewed or inspected during testing
  try {
    const logDir = path.resolve(process.cwd(), 'tmp/email-logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, `${Date.now()}-${to.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    fs.writeFileSync(logFile, JSON.stringify({ ...payload, timestamp: new Date().toISOString() }, null, 2));
  } catch (err) {
    console.error('Failed to log mock email locally:', err);
  }

  return true;
}

export function getEmailLayout(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0c0c12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0c12; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #161622; border: 1px solid #2e2e3f; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                <!-- Header / Logo -->
                <tr>
                  <td align="center" style="padding: 40px 40px 10px 40px;">
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.05em; color: #45f3ff; text-transform: uppercase;">
                      ⚡ OPS SUITE <span style="color: #ffffff; font-weight: 300;">PLATFORM</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Body -->
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    ${contentHtml}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px 30px 40px; background-color: #11111a; border-top: 1px solid #2e2e3f; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 11px; color: #6f7082; line-height: 1.5;">
                      This is an automated system email. Please do not reply directly.
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #45f3ff; font-weight: 600;">
                      &copy; 2026 Ops Suite. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendVerificationEmail(email: string, token: string, origin?: string): Promise<boolean> {
  const appUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationLink = `${appUrl}/auth/verify-email?token=${token}`;
  const htmlContent = `
    <h1 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 800; color: #ffffff; text-align: center;">Verify Your Account</h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a0aec0; text-align: center;">
      Welcome to your new workspace! To complete your registration and activate your system access, please confirm your email address below.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}" style="display: inline-block; padding: 14px 28px; background-color: #45f3ff; color: #0b0c10; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
        Activate Account
      </a>
    </div>
    <p style="margin: 24px 0 10px 0; font-size: 12px; line-height: 1.5; color: #718096; text-align: center;">
      If the button above does not work, copy and paste this address into your browser:
    </p>
    <p style="margin: 0; font-size: 11px; word-break: break-all; text-align: center;">
      <a href="${verificationLink}" style="color: #45f3ff; text-decoration: none;">${verificationLink}</a>
    </p>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address - Business Operations Suite',
    text: `Welcome to Business Operations Suite! Please verify your email by visiting: ${verificationLink}`,
    html: getEmailLayout('Verify Your Email Address', htmlContent)
  });
}

export async function sendPasswordResetEmail(email: string, token: string, origin?: string): Promise<boolean> {
  const appUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${appUrl}/auth/reset-password?token=${token}`;
  const htmlContent = `
    <h1 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 800; color: #ffffff; text-align: center;">Reset Your Password</h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a0aec0; text-align: center;">
      We received a request to reset the password associated with your account. Click the button below to configure a new password.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
        Reset Password
      </a>
    </div>
    <p style="margin: 24px 0 24px 0; font-size: 13px; line-height: 1.6; color: #a0aec0; text-align: center;">
      If you did not request this update, you can safely disregard this email. Your password will remain unchanged.
    </p>
    <p style="margin: 24px 0 10px 0; font-size: 12px; line-height: 1.5; color: #718096; text-align: center;">
      If the button above does not work, copy and paste this address into your browser:
    </p>
    <p style="margin: 0; font-size: 11px; word-break: break-all; text-align: center;">
      <a href="${resetLink}" style="color: #ef4444; text-decoration: none;">${resetLink}</a>
    </p>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Business Operations Suite',
    text: `You requested a password reset. Please visit this link to reset your password: ${resetLink}`,
    html: getEmailLayout('Reset Your Password', htmlContent)
  });
}

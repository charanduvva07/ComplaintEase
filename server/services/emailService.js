const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Verify Resend configuration at startup
const verifyEmailConfig = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not set — email sending disabled');
    console.warn('   Get your free API key at https://resend.com');
    return false;
  }
  console.log('✅ Resend API Key found — emails ready');
  return true;
};

// ──────────────────────────────────────────────────────────────
// sendEmail — never throws (email failure must not break requests)
// ──────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  if (!resend) {
    console.warn(`⚠️  Email skipped (no API key): to=${to}, subject="${subject}"`);
    return null;
  }

  try {
    // If using the default resend domain, you can only send to your own registered email!
    // To send to any user, you must verify a custom domain in Resend and update EMAIL_FROM.
    const fromAddress = process.env.EMAIL_FROM || 'ComplaintEase <onboarding@resend.dev>';
    
    // Resend expects 'to' to be an array or string.
    const toAddress = Array.isArray(to) ? to : [to];

    const data = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    if (data.error) {
      console.error(`❌ Resend API Error → ${to} | ${data.error.message}`);
      return null;
    }

    console.log(`📧 Email sent via Resend → ${to} | msgId: ${data.data?.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Email failed → ${to} | ${error.message}`);
    // Never throw — email failure must NOT break API responses
    return null;
  }
};

// ──────────────────────────────────────────────────────────────
// Email Templates
// ──────────────────────────────────────────────────────────────
const emailTemplates = {
  verifyEmail: (name, verifyUrl) => ({
    subject: 'Verify Your Email – ComplaintEase',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ComplaintEase</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Advanced Complaint Management System</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Hello, ${name}! 👋</h2>
          <p style="color: #64748b; line-height: 1.6;">Thank you for registering with ComplaintEase. Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2024 ComplaintEase. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  resetPassword: (name, resetUrl) => ({
    subject: 'Reset Your Password – ComplaintEase',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ComplaintEase</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Password Reset Request</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Hello, ${name}! 🔐</h2>
          <p style="color: #64748b; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">⚠️ This link expires in 10 minutes. If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
        </div>
      </div>
    `,
  }),

  complaintSubmitted: (name, complaintId, title) => ({
    subject: `Complaint Registered – ${complaintId} – ComplaintEase`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ComplaintEase</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Complaint Registered Successfully</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Hello, ${name}! ✅</h2>
          <p style="color: #64748b; line-height: 1.6;">Your complaint has been registered successfully. Here are the details:</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #475569;"><strong>Complaint ID:</strong> <span style="color: #6366f1; font-family: monospace;">${complaintId}</span></p>
            <p style="margin: 8px 0 0; color: #475569;"><strong>Subject:</strong> ${title}</p>
            <p style="margin: 8px 0 0; color: #475569;"><strong>Status:</strong> <span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 13px;">Submitted</span></p>
          </div>
          <p style="color: #64748b; font-size: 14px;">Our team will review your complaint and respond within 24-48 hours. You can track the status using your complaint ID.</p>
        </div>
      </div>
    `,
  }),

  statusChanged: (name, complaintId, title, oldStatus, newStatus) => ({
    subject: `Complaint Status Updated – ${complaintId} – ComplaintEase`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ComplaintEase</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Complaint Status Update</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Hello, ${name}! 🔔</h2>
          <p style="color: #64748b; line-height: 1.6;">The status of your complaint <strong>${complaintId}</strong> has been updated.</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #475569;"><strong>Complaint:</strong> ${title}</p>
            <p style="margin: 8px 0 0; color: #475569;"><strong>Previous Status:</strong> ${oldStatus}</p>
            <p style="margin: 8px 0 0; color: #475569;"><strong>New Status:</strong> <strong style="color: #6366f1;">${newStatus}</strong></p>
          </div>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates, verifyEmailConfig };

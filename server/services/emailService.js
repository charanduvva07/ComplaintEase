const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'ComplaintEase <noreply@complaintease.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email error:', error.message);
    // Don't throw - email failures shouldn't break the request
  }
};

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

module.exports = { sendEmail, emailTemplates };

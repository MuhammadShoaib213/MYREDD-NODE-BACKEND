// utils/emailService.js - CORRECTED VERSION
const nodemailer = require('nodemailer');

/**
 * Email service with proper async handling and error management
 */

// Create reusable transporter with connection pooling
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.OTP_SMTP_USER,
    pass: process.env.OTP_SMTP_PASS,
  },
  // Connection pooling for better performance
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Proper TLS configuration (SECURE)
  tls: {
    rejectUnauthorized: true, // Validate SSL certificates
    minVersion: 'TLSv1.2'
  },
  // Timeout settings
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000,
  socketTimeout: 30000,
});

// Verify SMTP connection on startup
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP server connection verified');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection error:', error.message);
    return false;
  }
};

// Call verification (non-blocking)
verifyConnection();

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} body - Email body (plain text)
 * @param {string} subject - Email subject
 * @param {Object} options - Additional options
 * @param {string} options.html - HTML version of the email
 * @param {Array} options.attachments - Email attachments
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendEmail = async (to, body, subject, options = {}) => {
  // Validate inputs
  if (!to || !subject) {
    throw new Error('Recipient email and subject are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    throw new Error('Invalid email format');
  }

  const mailOptions = {
    from: {
      name: 'MyRedd',
      address: process.env.OTP_SMTP_USER
    },
    to,
    subject,
    text: body,
    html: options.html || `<div style="font-family: Arial, sans-serif; padding: 20px;">
      <p>${body.replace(/\n/g, '<br>')}</p>
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">This email was sent from MyRedd. Please do not reply to this email.</p>
    </div>`,
    attachments: options.attachments || [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent to ${to}: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error; // Re-throw to let caller handle
  }
};

/**
 * Send OTP email with formatted template
 * @param {string} to - Recipient email
 * @param {string} otp - OTP code
 * @param {string} type - OTP type ('verification' | 'password_reset')
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
const sendOtpEmail = async (to, otp, type = 'verification') => {
  const subjects = {
    verification: 'Verify Your Email - MyRedd',
    password_reset: 'Reset Your Password - MyRedd'
  };

  const messages = {
    verification: `Your verification code is: ${otp}\n\nThis code will expire in 20 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    password_reset: `Your password reset code is: ${otp}\n\nThis code will expire in 20 minutes.\n\nIf you didn't request a password reset, please secure your account immediately.`
  };

  const htmlTemplates = {
    verification: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in <strong>20 minutes</strong>.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
    password_reset: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>Your password reset code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in <strong>20 minutes</strong>.</p>
        <p style="color: #cc0000; font-size: 14px;">If you didn't request a password reset, please secure your account immediately.</p>
      </div>
    `
  };

  return sendEmail(
    to,
    messages[type] || messages.verification,
    subjects[type] || subjects.verification,
    { html: htmlTemplates[type] || htmlTemplates.verification }
  );
};

/**
 * Send contact form email (using different SMTP if needed)
 * @param {Object} data - Contact form data
 * @param {string} data.name - Sender name
 * @param {string} data.email - Sender email
 * @param {string} data.message - Message content
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
const sendContactEmail = async (data) => {
  const { name, email, message, subject = 'New Contact Form Submission' } = data;

  // Create separate transporter for contact form if different credentials
  const contactTransporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.CONTACT_SMTP_USER || process.env.OTP_SMTP_USER,
      pass: process.env.CONTACT_SMTP_PASS || process.env.OTP_SMTP_PASS,
    },
    tls: { rejectUnauthorized: true }
  });

  const mailOptions = {
    from: process.env.CONTACT_SMTP_USER || process.env.OTP_SMTP_USER,
    to: process.env.CONTACT_EMAIL || 'support@myredd.net',
    replyTo: email,
    subject: `[Contact Form] ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
    `
  };

  try {
    const info = await contactTransporter.sendMail(mailOptions);
    console.log(`📧 Contact email received from ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send contact email:`, error.message);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendContactEmail,
  verifyConnection
};

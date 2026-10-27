const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Returns a configured nodemailer Gmail transporter, or null if credentials are not configured.
 */
const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️ [sendEmail] EMAIL_USER or EMAIL_APP_PASSWORD is not configured. Email sending skipped.');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Port 465 uses SSL/TLS
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
};

/**
 * Records an email delivery attempt to EmailLog (fire-and-forget, best-effort).
 */
const logEmailAttempt = (data) => {
  try {
    const EmailLog = require('../models/EmailLog');
    EmailLog.create({
      to: (data.to || 'unknown').toLowerCase().trim(),
      subject: data.subject || '(no subject)',
      type: data.type || 'system',
      status: data.status,
      sentBy: data.sentBy || null,
    }).catch((err) => {
      console.warn('⚠️ [sendEmail] Failed to write email log:', err.message);
    });
  } catch (err) {
    // Best-effort: completely swallow any logging error
  }
};

/**
 * Sends an email via Nodemailer Gmail SMTP.
 * Fails safely without throwing errors so the calling app never crashes.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Optional plain text fallback
 * @param {string} [options.type='system'] - Email type ('manual', 'spam', 'unspam', 'system')
 * @param {string} [options.sentBy=null] - Optional admin User ID who triggered the send
 * @returns {Promise<boolean>} True if sent, false otherwise
 */
const sendEmail = async ({ to, subject, html, text, type = 'system', sentBy = null }) => {
  try {
    if (!to) {
      console.warn('⚠️ [sendEmail] No recipient email specified.');
      logEmailAttempt({ to: 'unknown', subject, type, status: 'failed', sentBy });
      return false;
    }

    const mailer = getTransporter();
    if (!mailer) {
      logEmailAttempt({ to, subject, type, status: 'failed', sentBy });
      return false;
    }

    const fromAddress = `"BizPrimeHub" <${process.env.EMAIL_USER}>`;

    const info = await mailer.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || (html ? html.replace(/<[^>]+>/g, ' ') : ''),
    });

    console.log(`✉️ [sendEmail] Email successfully sent to: ${to} (Message ID: ${info.messageId})`);
    logEmailAttempt({ to, subject, type, status: 'sent', sentBy });
    return true;
  } catch (error) {
    // Log error but NEVER crash the application
    console.error(`❌ [sendEmail] Failed to send email to ${to}:`, error.message);
    logEmailAttempt({ to, subject, type, status: 'failed', sentBy });
    return false;
  }
};

module.exports = sendEmail;

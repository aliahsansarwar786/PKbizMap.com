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
 * Sends an email via Nodemailer Gmail SMTP.
 * Fails safely without throwing errors so the calling app never crashes.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Optional plain text fallback
 * @returns {Promise<boolean>} True if sent, false otherwise
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!to) {
      console.warn('⚠️ [sendEmail] No recipient email specified.');
      return false;
    }

    const mailer = getTransporter();
    if (!mailer) {
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
    return true;
  } catch (error) {
    // Log error but NEVER crash the application
    console.error(`❌ [sendEmail] Failed to send email to ${to}:`, error.message);
    return false;
  }
};

module.exports = sendEmail;

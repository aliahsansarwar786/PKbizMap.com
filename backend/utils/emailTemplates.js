/**
 * Email templates for BizPrimeHub transactional emails.
 */

const getBaseStyles = () => `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1f2937;
  line-height: 1.6;
  background-color: #f3f4f6;
  margin: 0;
  padding: 0;
`;

/**
 * Generates the Welcome Email HTML
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.loginUrl
 * @returns {string} HTML string
 */
const getWelcomeEmailHtml = ({ name, loginUrl }) => {
  const safeName = name || 'there';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to BizPrimeHub</title>
</head>
<body style="${getBaseStyles()} padding: 32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
          BizPrimeHub
        </h1>
        <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
          Pakistan &amp; Global Business Directory
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">
          Welcome aboard, ${safeName}! 👋
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #4b5563;">
          Thank you for joining <strong>BizPrimeHub</strong>. Your account has been created successfully.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
          With your BizPrimeHub account, you can list your business to reach thousands of potential customers, discover verified local services across Pakistan, UAE, and the USA, and manage your profile with ease.
        </p>

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 2px 6px rgba(37,99,235,0.35);">
                Log In to Your Account &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          If you did not create this account, please disregard this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          &copy; ${new Date().getFullYear()} BizPrimeHub. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Generates the Password Reset Email HTML
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.resetUrl
 * @returns {string} HTML string
 */
const getPasswordResetEmailHtml = ({ name, resetUrl }) => {
  const safeName = name || 'there';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your BizPrimeHub Password</title>
</head>
<body style="${getBaseStyles()} padding: 32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
          BizPrimeHub
        </h1>
        <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
          Account Security
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">
          Password Reset Request
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #4b5563;">
          Hello ${safeName},
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #4b5563;">
          We received a request to reset the password for your BizPrimeHub account. Click the button below to choose a new password:
        </p>

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 2px 6px rgba(37,99,235,0.35);">
                Reset Password &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- Notice -->
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 24px 0 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 500;">
            ⏳ This link is valid for <strong>1 hour</strong>. For security, it can only be used once.
          </p>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
          If you did not request a password reset, you can safely ignore this email. Your password will not change.
        </p>

        <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; word-break: break-all;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          &copy; ${new Date().getFullYear()} BizPrimeHub. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

module.exports = {
  getWelcomeEmailHtml,
  getPasswordResetEmailHtml,
};

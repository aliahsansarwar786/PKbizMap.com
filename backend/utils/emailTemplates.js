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

/**
 * Generates the Owner Notification Email HTML for a new listing submission
 * @param {Object} params
 * @param {string} params.businessTitle
 * @param {string} params.category
 * @param {string} params.city
 * @param {string} params.country
 * @param {string} params.submittedByName
 * @param {string} params.submittedByEmail
 * @param {string} params.pendingUrl
 * @returns {string} HTML string
 */
const getNewListingNotificationHtml = ({
  businessTitle,
  category,
  city,
  country,
  submittedByName,
  submittedByEmail,
  pendingUrl,
}) => {
  const safeTitle = businessTitle || 'Untitled Business';
  const safeCategory = category || 'General';
  const safeCity = city || 'N/A';
  const safeCountry = country || 'Pakistan';
  const safeSubmitterName = submittedByName || 'Registered User';
  const safeSubmitterEmail = submittedByEmail || 'N/A';
  const safeUrl = pendingUrl || 'https://bizprimehub.vercel.app/folder/new/admin';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Listing Submitted: ${safeTitle}</title>
</head>
<body style="${getBaseStyles()} padding: 32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
          BizPrimeHub
        </h1>
        <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
          Owner Notification • New Business Listing
        </p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <div style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; border: 1px solid #a7f3d0;">
          🔔 New Listing Submission
        </div>

        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #111827;">
          A new business has been submitted for review
        </h2>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
          A user has submitted a new business listing on <strong>BizPrimeHub</strong>. Below are the submission details:
        </p>

        <!-- Business Details Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; width: 35%;">Business Name</td>
            <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #111827; border-bottom: 1px solid #e5e7eb;">${safeTitle}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Category</td>
            <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${safeCategory}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Location</td>
            <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${safeCity}, ${safeCountry}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Submitted By</td>
            <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${safeSubmitterName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280;">Submitter Email</td>
            <td style="padding: 12px 16px; font-size: 14px; color: #2563eb;">${safeSubmitterEmail}</td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px 0;">
          <tr>
            <td align="center">
              <a href="${safeUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 2px 6px rgba(37,99,235,0.35);">
                Review Listing in Admin Panel &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center; word-break: break-all;">
          Direct Link: <a href="${safeUrl}" style="color: #2563eb;">${safeUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          This automated alert was sent to the platform owner. You can configure notification settings in the Admin Panel.
        </p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #d1d5db;">
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
 * Generates the Owner Notification Email HTML for a new user registration
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.date
 * @returns {string} HTML string
 */
const getNewUserNotificationHtml = ({ name, email, date }) => {
  const safeName = name || 'New User';
  const safeEmail = email || 'N/A';
  const safeDate = date || new Date().toUTCString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New User Registered: ${safeName}</title>
</head>
<body style="${getBaseStyles()} padding: 32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
          BizPrimeHub
        </h1>
        <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
          Owner Notification • New User Registration
        </p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <div style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; border: 1px solid #bfdbfe;">
          👤 New User Registration
        </div>

        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #111827;">
          A new user has registered on BizPrimeHub
        </h2>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
          A new user account has been successfully created. Here are the registration details:
        </p>

        <!-- User Details Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; width: 35%;">User Name</td>
            <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #111827; border-bottom: 1px solid #e5e7eb;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Email Address</td>
            <td style="padding: 12px 16px; font-size: 14px; color: #2563eb; border-bottom: 1px solid #e5e7eb;">${safeEmail}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Registration Date</td>
            <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${safeDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280;">Account Status</td>
            <td style="padding: 12px 16px; font-size: 14px; color: #059669; font-weight: 600;">Active Member</td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; color: #6b7280;">
          The user has received their welcome email and can now log in and manage listings.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          This automated alert was sent to the platform owner. You can configure notification settings in the Admin Panel.
        </p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #d1d5db;">
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
 * Generates the Email Verification OTP HTML
 * Contains ONLY the 6-digit code - NO login button, NO other CTAs.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.otp
 * @returns {string} HTML string
 */
const getEmailVerificationOtpHtml = ({ name, otp }) => {
  const safeName = name || 'there';
  const safeOtp = String(otp || '').trim();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your BizPrimeHub Verification Code</title>
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
          Email Verification
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">
          Verify Your Email Address
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #4b5563;">
          Hello ${safeName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
          Thank you for registering on <strong>BizPrimeHub</strong>. Please enter the following 6-digit verification code to confirm your email address and activate your account:
        </p>

        <!-- High-Contrast Large OTP Code Box (NO CTA buttons) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <div style="display: inline-block; background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 18px 36px; text-align: center;">
                <span style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1e3a8a; display: block; margin-left: 10px;">
                  ${safeOtp}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Expiry Alert -->
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 24px 0 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
            ⏳ This code expires in <strong>3 minutes</strong> and can only be used once.
          </p>
        </div>

        <!-- Security & Spam Notice -->
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
          Didn't request this verification code? You can safely ignore this email — your account will not be activated without it.
        </p>
        <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
          💡 <em>Tip: If you ever have trouble finding our emails, please check your spam or junk folder.</em>
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
 * Generates the Password Reset OTP HTML
 * Contains ONLY the 6-digit code - NO login button, NO other CTAs.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.otp
 * @returns {string} HTML string
 */
const getPasswordResetOtpHtml = ({ name, otp }) => {
  const safeName = name || 'there';
  const safeOtp = String(otp || '').trim();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your BizPrimeHub Password Reset Code</title>
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
          Password Reset Code
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #4b5563;">
          Hello ${safeName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
          We received a request to reset the password for your BizPrimeHub account. Enter the following 6-digit verification code to proceed:
        </p>

        <!-- High-Contrast Large OTP Code Box (NO CTA buttons) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <div style="display: inline-block; background: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 18px 36px; text-align: center;">
                <span style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1e3a8a; display: block; margin-left: 10px;">
                  ${safeOtp}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Expiry Alert -->
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 24px 0 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
            ⏳ This code expires in <strong>3 minutes</strong> and can only be used once.
          </p>
        </div>

        <!-- Security Notice -->
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
          Didn't request this code? You can safely ignore this email. Your password will remain unchanged and your account remains secure.
        </p>
        <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
          💡 <em>Tip: If you ever have trouble finding our emails, please check your spam or junk folder.</em>
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
 * Generates the Password Changed Confirmation HTML
 * @param {Object} params
 * @param {string} params.name
 * @returns {string} HTML string
 */
const getPasswordChangedSuccessEmailHtml = ({ name }) => {
  const safeName = name || 'there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your BizPrimeHub Password Has Been Changed</title>
</head>
<body style="${getBaseStyles()} padding: 32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #065f46 0%, #059669 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
          BizPrimeHub
        </h1>
        <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
          Security Alert
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">
          Your Password Was Successfully Changed
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #4b5563;">
          Hello ${safeName},
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
          This email confirms that the password for your BizPrimeHub account was successfully changed on <strong>${new Date().toUTCString()}</strong>.
        </p>

        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #065f46; font-weight: 600;">
            ✓ Your account is secure. You can now log in using your new password.
          </p>
        </div>

        <p style="margin: 20px 0 0 0; font-size: 13px; color: #dc2626; line-height: 1.5;">
          <strong>Didn't make this change?</strong> If you did not authorize this password change, please contact our support team immediately or request a new password reset.
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
  getNewListingNotificationHtml,
  getNewUserNotificationHtml,
  getEmailVerificationOtpHtml,
  getPasswordResetOtpHtml,
  getPasswordChangedSuccessEmailHtml,
};


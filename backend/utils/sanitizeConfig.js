const SANITIZE_EXEMPT_FIELDS = new Set([
  'category',
  'country',
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'otp',
  'resetToken',
  'email',
  'newEmail',
]);

module.exports = { SANITIZE_EXEMPT_FIELDS };

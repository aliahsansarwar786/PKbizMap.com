/**
 * Startup environment variable validation.
 * Fails fast on missing required variables (NODE_ENV, MONGO_URI, JWT_SECRET).
 * Warns on missing optional integration variables (Cloudinary, Email).
 */
const validateEnv = () => {
  // 1. NODE_ENV validation
  const nodeEnv = process.env.NODE_ENV;
  const allowedNodeEnvs = ['development', 'production', 'test'];

  if (!nodeEnv || !nodeEnv.trim()) {
    throw new Error('Required environment variable "NODE_ENV" is unset.');
  }

  if (!allowedNodeEnvs.includes(nodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV "${nodeEnv}". Must be one of: ${allowedNodeEnvs.join(', ')}`
    );
  }

  // 2. Required variables: MONGO_URI, JWT_SECRET
  const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
  for (const varName of requiredVars) {
    const val = process.env[varName];
    if (!val || !val.trim()) {
      throw new Error(`Required environment variable "${varName}" is missing or empty.`);
    }
  }

  // JWT_SECRET strength check
  const weakPlaceholders = [
    'secret',
    'your-secret',
    'your_jwt_secret',
    'changeme',
    'change-me',
    'jwt-secret',
    'jwt_secret',
    'test',
    'password',
    'dev-secret',
    'bizprimehub',
  ];

  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  const isWeakPlaceholder = weakPlaceholders.includes(jwtSecret.toLowerCase());
  const isShortSecret = jwtSecret.length < 32;

  if (isShortSecret || isWeakPlaceholder) {
    if (nodeEnv === 'production') {
      throw new Error(
        'Insecure JWT_SECRET in production. It must be at least 32 characters long and not a common placeholder.'
      );
    } else {
      console.warn(
        '⚠️ [Startup Warning] JWT_SECRET is weak or shorter than 32 characters. Consider using a stronger secret.'
      );
    }
  }

  // 3. Optional integration variables: Cloudinary, Email
  const optionalWarnVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'EMAIL_USER',
    'EMAIL_APP_PASSWORD',
  ];

  for (const varName of optionalWarnVars) {
    const val = process.env[varName];
    if (!val || !val.trim()) {
      console.warn(
        `⚠️ [Startup Warning] Optional environment variable "${varName}" is missing or empty. Related features (uploads/email) will fail if invoked.`
      );
    }
  }
};

module.exports = validateEnv;


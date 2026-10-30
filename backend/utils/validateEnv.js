/**
 * Startup environment variable validation.
 * Fails fast on missing required variables (MONGO_URI, JWT_SECRET, invalid NODE_ENV).
 * Warns on missing optional integration variables (Cloudinary, Email, unset NODE_ENV).
 */
const validateEnv = () => {
  // 1. NODE_ENV validation
  const nodeEnv = process.env.NODE_ENV;
  const allowedNodeEnvs = ['development', 'production', 'test'];

  if (nodeEnv) {
    if (!allowedNodeEnvs.includes(nodeEnv)) {
      throw new Error(
        `Invalid NODE_ENV "${nodeEnv}". Must be one of: ${allowedNodeEnvs.join(', ')}`
      );
    }
  } else {
    console.warn(
      '⚠️ [Startup Warning] NODE_ENV is unset. Defaulting behavior to "development".'
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


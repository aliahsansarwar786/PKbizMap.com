/**
 * Admin Seeder Script
 *
 * Usage: npm run seed:admin
 *
 * Creates the first admin user from environment variables.
 * Safe to run multiple times - will skip if admin already exists.
 *
 * Required .env variables:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, MONGO_URI
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not set in .env');
    process.exit(1);
  }
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      console.log(`ℹ️  Admin already exists: ${existing.email}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user - password hashing handled by pre-save hook
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Super Admin',
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
    });

    console.log(`✅ Admin created successfully: ${admin.email}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error seeding admin: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();

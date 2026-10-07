require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testUsage() {
  try {
    const usage = await cloudinary.api.usage();
    console.log(JSON.stringify(usage, null, 2));
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

testUsage();

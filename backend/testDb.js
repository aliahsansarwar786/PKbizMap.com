require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'ali.ahsan.47.ali@gmail.com' }).select('+password');
  console.log("Found user:", !!user);
  if (user) {
    const isMatch = await bcrypt.compare('A1h2s3a4n5@ali47', user.password);
    console.log("Password match:", isMatch);
    if (!isMatch) {
       console.log("Resetting password again carefully...");
       user.password = 'A1h2s3a4n5@ali47';
       await user.save();
       console.log("Resaved.");
       const newIsMatch = await bcrypt.compare('A1h2s3a4n5@ali47', user.password);
       console.log("New Password match:", newIsMatch);
    }
  }
  process.exit();
};
test();

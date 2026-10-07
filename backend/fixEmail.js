require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const fix = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'ali.ahsan.47.ali@gmail.com' });
  if (user) {
    user.email = 'aliahsan47ali@gmail.com';
    await user.save();
    console.log("Email fixed to aliahsan47ali@gmail.com");
  } else {
    const check = await User.findOne({ email: 'aliahsan47ali@gmail.com' });
    if(check) {
       console.log("Email already fixed.");
       check.password = 'A1h2s3a4n5@ali47';
       await check.save();
    }
  }
  process.exit();
};
fix();

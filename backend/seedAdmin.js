const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to DB');
  
  const adminEmail = 'admin@bizdirectory.com';
  const adminPassword = 'admin123'; // simple password
  
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Site Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });
    console.log('Admin created successfully.');
  } else {
    admin.password = adminPassword;
    admin.role = 'admin';
    await admin.save();
    console.log('Admin password updated successfully.');
  }
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

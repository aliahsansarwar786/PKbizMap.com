const mongoose = require('mongoose');
const Business = require('./models/Business');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const businesses = await Business.find().populate('owner');
  console.log("Total Businesses in DB:", businesses.length);
  businesses.forEach(b => {
    console.log(`- ${b.title} | Owner: ${b.owner ? b.owner.email : 'None'} | Approved: ${b.isApproved}`);
  });
  mongoose.connection.close();
});

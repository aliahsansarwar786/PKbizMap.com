const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    await mongoose.connection.db.collection('users').dropIndex('username_1');
    console.log('Old username index dropped successfully!');
  } catch(e) {
    console.log('Error or index not found:', e.message);
  }
  process.exit();
});

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { isValidCity } = require('../utils/locations');

async function runMigration() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing from environment.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  const collection = mongoose.connection.db.collection('businesses');
  const businesses = await collection.find({}).toArray();

  console.log(`Found ${businesses.length} total businesses in DB.`);
  let updatedCount = 0;

  for (const b of businesses) {
    let needsUpdate = false;
    const updates = {};

    let currentCity = b.address?.city || '';
    let currentCountry = b.address?.country;

    // Fix typo: "multsn" -> "Multan"
    if (typeof currentCity === 'string' && currentCity.trim().toLowerCase() === 'multsn') {
      updates['address.city'] = 'Multan';
      currentCity = 'Multan';
      needsUpdate = true;
      console.log(`[Typo Fix] Business "${b.title}" (_id: ${b._id}): city "multsn" -> "Multan"`);
    }

    // Set address.country = 'Pakistan' if missing, null, empty or undefined
    if (!currentCountry || currentCountry.trim() === '') {
      updates['address.country'] = 'Pakistan';
      needsUpdate = true;
      console.log(`[Country Set] Business "${b.title}" (_id: ${b._id}): missing country -> "Pakistan"`);
    }

    if (needsUpdate) {
      await collection.updateOne(
        { _id: b._id },
        { $set: updates }
      );
      updatedCount++;
    }
  }

  console.log(`\nMigration completed successfully.`);
  console.log(`Updated ${updatedCount} out of ${businesses.length} businesses.`);

  // Verification step
  const verified = await collection.find({}).toArray();
  console.log('\n--- Post-migration verification ---');
  verified.forEach(b => {
    console.log({
      _id: b._id,
      title: b.title,
      country: b.address?.country,
      city: b.address?.city
    });
  });

  await mongoose.disconnect();
  console.log('Database disconnected.');
}

if (require.main === module) {
  runMigration().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = runMigration;

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { isValidCity } = require('../utils/locations');

async function runMigration() {
  const isDryRunForced = process.argv.includes('--dry-run');
  const isConfirmed = process.argv.includes('--confirm') && !isDryRunForced;
  const isDryRun = !isConfirmed;

  if (isDryRun) {
    console.log('DRY RUN — no writes. Re-run with --confirm to apply.');
  } else {
    console.log('BACKUP FIRST — make sure you have a database backup before confirming.');
  }

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
  const needsManualReview = [];

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
      if (isDryRun) {
        console.log(`[Dry Run Typo Fix] Business "${b.title}" (_id: ${b._id}): city "multsn" -> "Multan"`);
      } else {
        console.log(`[Typo Fix] Business "${b.title}" (_id: ${b._id}): city "multsn" -> "Multan"`);
      }
    }

    // Set address.country = 'Pakistan' if missing, null, empty or undefined, ONLY if city is a valid Pakistan city
    const trimmedCountry = typeof currentCountry === 'string' ? currentCountry.trim() : '';
    if (!trimmedCountry) {
      if (isValidCity('Pakistan', currentCity)) {
        updates['address.country'] = 'Pakistan';
        needsUpdate = true;
        if (isDryRun) {
          console.log(`[Dry Run Country Set] Business "${b.title}" (_id: ${b._id}): missing country -> "Pakistan" (valid PK city: "${currentCity}")`);
        } else {
          console.log(`[Country Set] Business "${b.title}" (_id: ${b._id}): missing country -> "Pakistan" (valid PK city: "${currentCity}")`);
        }
      } else {
        needsManualReview.push({
          _id: b._id,
          title: b.title,
          city: currentCity,
        });
      }
    }

    if (needsUpdate) {
      if (isConfirmed) {
        await collection.updateOne(
          { _id: b._id },
          { $set: updates }
        );
      }
      updatedCount++;
    }
  }

  if (needsManualReview.length > 0) {
    console.log(`\n--- Needs Manual Review (${needsManualReview.length} businesses with missing country and unrecognized Pakistan city) ---`);
    needsManualReview.forEach((item) => {
      console.log(`- "${item.title}" (_id: ${item._id}, city: "${item.city}")`);
    });
  }

  if (isDryRun) {
    console.log(`\n--- Dry Run Summary ---`);
    console.log(`Total businesses that would be updated: ${updatedCount} out of ${businesses.length}.`);
    await mongoose.disconnect();
    console.log('Database disconnected.');
    return;
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

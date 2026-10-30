require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { CATEGORIES, CATEGORY_MAP, normalizeCategory } = require('../utils/categories');

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
  console.log('Connected to MongoDB.');

  const collection = mongoose.connection.db.collection('businesses');
  const businesses = await collection.find({}).toArray();

  console.log(`Found ${businesses.length} total businesses in DB.`);

  let updatedCount = 0;
  const migrationLog = {};

  for (const b of businesses) {
    const originalCategory = (b.category || '').trim();
    const canonicalCategory = normalizeCategory(originalCategory);

    if (canonicalCategory && canonicalCategory !== originalCategory) {
      if (isConfirmed) {
        await collection.updateOne(
          { _id: b._id },
          { $set: { category: canonicalCategory } }
        );
      }
      updatedCount++;

      const key = `${originalCategory} -> ${canonicalCategory}`;
      migrationLog[key] = (migrationLog[key] || 0) + 1;
    }
  }

  if (isDryRun) {
    console.log('\n--- Dry Run Summary ---');
    console.log(`Total listings that would be updated: ${updatedCount} out of ${businesses.length}`);
    console.log('Planned changes breakdown:');
    Object.entries(migrationLog).forEach(([mapping, count]) => {
      console.log(`  ${mapping}: ${count} listings`);
    });
    await mongoose.disconnect();
    console.log('\nDatabase disconnected.');
    return;
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Total listings updated: ${updatedCount} out of ${businesses.length}`);
  console.log('Changes breakdown:');
  Object.entries(migrationLog).forEach(([mapping, count]) => {
    console.log(`  ${mapping}: ${count} listings`);
  });

  // Post-migration category distribution check
  const afterBusinesses = await collection.find({}).toArray();
  const categoryCounts = {};
  afterBusinesses.forEach((b) => {
    const cat = b.category || '(blank)';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  console.log('\n--- Post-migration Category Distribution ---');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const isValid = CATEGORIES.includes(cat);
      console.log(`  ${cat}: ${count} listings ${isValid ? '✓ (canonical)' : '⚠️ (NOT in canonical whitelist)'}`);
    });

  await mongoose.disconnect();
  console.log('\nDatabase disconnected.');
}

if (require.main === module) {
  runMigration().catch((err) => {
    console.error('Category migration failed:', err);
    process.exit(1);
  });
}

module.exports = runMigration;

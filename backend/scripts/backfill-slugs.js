require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { slugify } = require('../utils/slugify');

async function runBackfill() {
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
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB.');

  const collection = mongoose.connection.db.collection('businesses');
  const businesses = await collection.find({}).sort({ createdAt: 1 }).toArray();

  console.log(`Found ${businesses.length} total businesses in DB.`);

  const usedSlugs = new Set();
  const collisionLog = [];
  let updatedCount = 0;
  let alreadyHadSlugCount = 0;

  // First pass: register any existing valid slugs
  for (const b of businesses) {
    if (b.slug && typeof b.slug === 'string' && b.slug.trim()) {
      usedSlugs.add(b.slug.trim());
      alreadyHadSlugCount++;
    }
  }

  // Second pass: generate slugs for businesses missing one
  for (const b of businesses) {
    if (b.slug && typeof b.slug === 'string' && b.slug.trim()) {
      continue;
    }

    const baseSlug = slugify(b.title) || 'business';
    let assignedSlug = '';

    if (!usedSlugs.has(baseSlug)) {
      assignedSlug = baseSlug;
    } else {
      // Collision detected! Resolve by appending city, then counter
      const citySlug = slugify(b.address?.city);
      let candidate = citySlug ? `${baseSlug}-${citySlug}` : `${baseSlug}-1`;

      if (usedSlugs.has(candidate)) {
        const prefix = citySlug ? `${baseSlug}-${citySlug}` : baseSlug;
        let counter = 2;
        while (usedSlugs.has(`${prefix}-${counter}`)) {
          counter++;
        }
        candidate = `${prefix}-${counter}`;
      }

      assignedSlug = candidate;
      collisionLog.push({
        id: b._id.toString(),
        title: b.title,
        city: b.address?.city || 'N/A',
        baseSlug,
        assignedSlug,
      });
    }

    usedSlugs.add(assignedSlug);

    if (isConfirmed) {
      await collection.updateOne(
        { _id: b._id },
        { $set: { slug: assignedSlug } }
      );
    }
    updatedCount++;

    if (updatedCount % 200 === 0) {
      console.log(`Processed ${updatedCount} businesses...`);
    }
  }

  if (isDryRun) {
    console.log('\n--- Dry Run Summary ---');
    console.log(`Total businesses in DB: ${businesses.length}`);
    console.log(`Already have slug: ${alreadyHadSlugCount}`);
    console.log(`Planned slugs to generate: ${updatedCount}`);
    console.log(`Planned collision resolutions: ${collisionLog.length}`);
    if (collisionLog.length > 0) {
      console.log('\nPlanned collision details (first 10):');
      collisionLog.slice(0, 10).forEach((c, idx) => {
        console.log(`  ${idx + 1}. "${c.title}" (${c.city}) -> Base: "${c.baseSlug}" -> Planned: "${c.assignedSlug}"`);
      });
      if (collisionLog.length > 10) {
        console.log(`  ...and ${collisionLog.length - 10} more collision(s).`);
      }
    }
    await mongoose.disconnect();
    console.log('Database disconnected.');
    return;
  }

  console.log('\n--- Building Unique Index on slug ---');
  try {
    await collection.createIndex({ slug: 1 }, { unique: true });
    console.log('Unique index on slug ensured.');
  } catch (err) {
    console.warn('Index notice:', err.message);
  }

  console.log('\n--- Verification ---');
  const missingSlugCount = await collection.countDocuments({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
  });

  const distinctSlugs = await collection.distinct('slug');
  const totalCount = await collection.countDocuments({});

  console.log(`Total businesses in DB: ${totalCount}`);
  console.log(`Already had slug: ${alreadyHadSlugCount}`);
  console.log(`Slugs newly generated: ${updatedCount}`);
  console.log(`Missing slug count: ${missingSlugCount}`);
  console.log(`Distinct unique slugs: ${distinctSlugs.length}`);
  console.log(`Collisions resolved: ${collisionLog.length}`);

  if (collisionLog.length > 0) {
    console.log('\nResolved collisions details:');
    collisionLog.forEach((c, idx) => {
      console.log(`  ${idx + 1}. "${c.title}" (${c.city}) -> Base: "${c.baseSlug}" -> Resolved: "${c.assignedSlug}"`);
    });
  }

  if (missingSlugCount === 0 && distinctSlugs.length === totalCount) {
    console.log('\n✅ VERIFICATION SUCCESS: All businesses have a unique slug!');
  } else {
    console.error('\n❌ VERIFICATION FAILED: Mismatch in slugs!');
    process.exit(1);
  }

  await mongoose.disconnect();
  console.log('Database disconnected.');
}

if (require.main === module) {
  runBackfill().catch((err) => {
    console.error('Backfill error:', err);
    process.exit(1);
  });
}

module.exports = runBackfill;

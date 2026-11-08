const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const Aircraft = require('../models/Aircraft');
const { getFullFleet } = require('../seed/fleetData');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orbelo';

async function seedFleet() {
  console.log('🌱 [Orbelo Fleet Seeder] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log('✅ Connected to MongoDB at:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));

  const fullFleet = getFullFleet();
  console.log(`📦 Loaded ${fullFleet.length} aircraft records across all categories.`);

  // Clear existing aircraft
  const deleted = await Aircraft.deleteMany({});
  console.log(`🧹 Removed ${deleted.deletedCount} existing aircraft records.`);

  // Insert all 200 aircraft
  const inserted = await Aircraft.insertMany(fullFleet);
  console.log(`✈️ Successfully inserted ${inserted.length} private jets!`);

  // Verify breakdown by category
  const breakdown = await Aircraft.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, categoryLabel: { $first: '$categoryLabel' } } },
    { $sort: { _id: 1 } },
  ]);

  console.log('\n📊 Fleet Distribution Summary:');
  console.log('────────────────────────────────────────────────────────────');
  breakdown.forEach((item, index) => {
    console.log(` ${index + 1}. [${item._id}] ${item.categoryLabel}: ${item.count} aircraft`);
  });
  console.log('────────────────────────────────────────────────────────────');
  console.log(`🏁 Total Private Jets Seeded: ${inserted.length}`);

  // Sample verification of images
  const sampleWithImages = await Aircraft.findOne({ category: 'heavy' });
  console.log(`\n🔍 Verification Check on "${sampleWithImages.name}":`);
  console.log(`   - Exterior Image: ${sampleWithImages.imageExterior}`);
  console.log(`   - Interior Image: ${sampleWithImages.imageInterior}`);
  console.log(`   - Image Gallery Count: ${sampleWithImages.images.length}`);
  console.log(`   - Toilette: ${sampleWithImages.toilette}`);
  console.log(`   - Full Galley: ${sampleWithImages.fullGalley}`);
  console.log(`   - Tail/Reg: "${sampleWithImages.registration}" (clean - no tail number)`);

  await mongoose.connection.close();
  console.log('\n✨ Database connection closed successfully. Fleet seeding complete!');
}

if (require.main === module) {
  seedFleet().catch((err) => {
    console.error('❌ Fleet seeding failed:', err);
    process.exit(1);
  });
}

module.exports = seedFleet;

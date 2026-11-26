/**
 * Clears transactional data so the platform can start fresh:
 *   - Requests            (AgentRequest)
 *   - Quotes, trips, invoices, contracts, trip documents (all stored on Booking)
 *   - ID counters         (Sequence) so new REQ/QUO/TRI numbers start fresh
 *
 * Everything else is kept: users, clients, contacts, operators, aircraft,
 * messages, notifications, audit log, tax rules, curator tiers, flight watch,
 * sourcing options, message automations, account preferences, policy documents.
 *
 * Usage (dry run, only counts):   npm run clear-data
 * Usage (actually delete):        npm run clear-data -- --yes
 * The database is taken from MONGODB_URI.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const AgentRequest = require('../models/AgentRequest');
const Booking = require('../models/Booking');
const Sequence = require('../models/Sequence');

const TARGETS = [
  { label: 'Requests', model: AgentRequest },
  { label: 'Quotes / trips / invoices (bookings)', model: Booking },
  { label: 'ID counters', model: Sequence },
];

const main = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set.');
    process.exit(1);
  }
  const execute = process.argv.includes('--yes');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, socketTimeoutMS: 60000 });
  const { host, name } = mongoose.connection;
  console.log(`Connected to database "${name}" on ${host}`);
  console.log(execute ? '\n⚠️  DELETING:' : '\nDry run — this would delete:');

  for (const { label, model } of TARGETS) {
    const count = await model.countDocuments();
    if (execute) {
      const { deletedCount } = await model.deleteMany({});
      console.log(`  ${label}: deleted ${deletedCount}`);
    } else {
      console.log(`  ${label}: ${count}`);
    }
  }

  if (!execute) {
    console.log('\nNothing was deleted. Run again with --yes to delete these.');
  } else {
    console.log('\n✅ Done. Users, clients, contacts, operators, aircraft and settings were kept.');
  }
  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error('❌ Failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

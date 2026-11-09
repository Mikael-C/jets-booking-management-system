const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const Aircraft = require('../models/Aircraft');
const Client = require('../models/Client');
const Operator = require('../models/Operator');
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { getFullFleet } = require('../seed/fleetData');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orbelo';

const seedDatabase = async (force = false) => {
  const isDirect = mongoose.connection.readyState === 0;
  if (isDirect) {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ Connected to MongoDB');
  }

  const forceSeed = force || process.env.FORCE_SEED === 'true';
  const existingUsers = await User.countDocuments();
  const existingClients = await Client.countDocuments();
  const existingOperators = await Operator.countDocuments();
  const existingBookings = await Booking.countDocuments();

  if (existingUsers > 0 && existingClients > 0 && existingOperators > 0 && !forceSeed) {
    console.log(`ℹ️ Database already contains data (${existingUsers} users, ${existingClients} clients, ${existingOperators} operators, ${existingBookings} bookings).`);

    // Ensure bookings collection is seeded if empty
    if (existingBookings === 0) {
      console.log('✈️ Existing database has 0 bookings. Seeding initial flight bookings...');
      try {
        const bookingsData = require('../seed/initialBookingsData.json');
        await Booking.insertMany(bookingsData);
        console.log(`✅ Seeded ${bookingsData.length} flight bookings into database!`);
      } catch (err) {
        console.warn('Booking seeding error:', err.message);
      }
    }
    
    // Check if aircraft collection needs updating with verified authentic images
    const oldAircraftCount = await Aircraft.countDocuments({
      $or: [
        { imageExterior: { $regex: /unsplash/i } },
        { imageInterior: { $regex: /unsplash/i } }
      ]
    });
    const totalAircraft = await Aircraft.countDocuments();

    if (oldAircraftCount > 0 || totalAircraft !== 200) {
      console.log(`✈️ Updating Aircraft fleet with verified 100% authentic aviation images (${totalAircraft} aircraft found, ${oldAircraftCount} had legacy images)...`);
      await Aircraft.deleteMany({});
      const fleetData = getFullFleet();
      const newAircraft = await Aircraft.insertMany(fleetData);
      console.log(`✅ Refreshed fleet with ${newAircraft.length} verified authentic private jets!`);
    }

    if (isDirect && require.main === module) {
      await mongoose.connection.close();
    }
    return { skipped: true, existingUsers, existingClients, existingOperators };
  }

  console.log(existingClients === 0 ? '🌱 Seeding initial Orbelo data...' : '⚠️ FORCE_SEED=true detected. Clearing and re-seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Aircraft.deleteMany({}), Client.deleteMany({}),
    Operator.deleteMany({}), Booking.deleteMany({}), AgentRequest.deleteMany({}),
    Notification.deleteMany({}), AuditLog.deleteMany({})
  ]);
  console.log('🧹 Cleared existing collections');

  // ─── Users ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('orbelo2026!', 12);
  const users = await User.insertMany([
    { name: 'Maximilian von Bern', email: 'superadmin@orbelo.com', passwordHash, role: 'super_admin', isActive: true, title: 'Chief Executive Officer & Super Admin' },
    { name: 'Capt. Alexander Vance', email: 'admin@orbelo.com', passwordHash, role: 'admin', isActive: true, title: 'Flight Operations Director' },
    { name: 'Elena Rostova', email: 'finance@orbelo.com', passwordHash, role: 'finance', isActive: true, title: 'Chief Financial Officer' },
    { name: 'David Schneider', email: 'ops@orbelo.com', passwordHash, role: 'operations', isActive: true, title: 'Flight Dispatch & OCC' },
    { name: 'Marcus Vance', email: 'agent@orbelo.com', passwordHash, role: 'agent', isActive: true, title: 'Executive Charter Broker' },
    { name: 'Sophia Laurent', email: 'sophia@orbelo.com', passwordHash, role: 'agent', isActive: true, title: 'Senior Charter Broker' },
  ]);
  console.log(`👤 Created ${users.length} users`);

  // ─── Aircraft (200 curated private jets across 10 categories) ────────
  const fleetData = getFullFleet();
  const aircraft = await Aircraft.insertMany(fleetData);
  console.log(`✈️  Created ${aircraft.length} aircraft across 10 categories (20 per category)`);

  // ─── Clients ───────────────────────────────────────────
  const clients = await Client.insertMany([
    {
      accountNumber: 'ACC-21737', fullName: 'Edward Brinkmann', companyName: 'Brinkmann Global Capital',
      streetAddress: '3606 Enterprise Ave', cityPostalCountry: 'FL-34104 Naples, United States',
      phone: '+1 239 555 0192', email: 'ebrinkmann@bgcapital.com', vatNumber: 'US-8492041',
      totalBookings: 6, totalSpend: 184500, vipTier: 'Ultra HNWI',
      preferredJetCategory: 'Super Midsize / Large',
      notes: 'Requires chilled vintage Dom Pérignon and immediate ramp-side Mercedes S-Class transfer.'
    },
    {
      accountNumber: 'ACC-99482', fullName: 'Countess Sophie von Habsburg', companyName: 'Habsburg Heritage Foundation',
      streetAddress: 'Herrengasse 14', cityPostalCountry: 'A-1010 Vienna, Austria',
      phone: '+43 1 512 8901', email: 'sophie.habsburg@heritage.at', vatNumber: 'ATU 9948 2104',
      totalBookings: 4, totalSpend: 92400, vipTier: 'Family Office',
      preferredJetCategory: 'Light Jet (Citation Mustang / Phenom)',
      notes: 'Prefers pet-friendly cabins. Travels with miniature dachshund (valid EU pet passport).'
    },
    {
      accountNumber: 'ACC-48392', fullName: 'Alexander Moretti', companyName: 'Moretti Luxury Yachts S.r.l.',
      streetAddress: '7 Boulevard Albert 1er', cityPostalCountry: 'MC-98000 Monaco',
      phone: '+377 97 97 12 00', email: 'alex@morettiyachts.mc', vatNumber: 'FR 48 392 849 102',
      totalBookings: 8, totalSpend: 246800, vipTier: 'Corporate Executive',
      preferredJetCategory: 'Super Midsize (Challenger 350)',
      notes: 'Always requests helicopter transfer from Nice Côte d\'Azur (LFMN) to Monaco Heliport (LNMC).'
    }
  ]);
  console.log(`👥 Created ${clients.length} clients`);

  // ─── Operators ─────────────────────────────────────────
  const stdChecklist = [
    'Air Operator Certificate (AOC)', 'Aircraft registered on AOC',
    'Certificate of Airworthiness (ARC)', 'Third Party & Passenger Liability Insurance',
    'Independent Safety Audit Rating', 'Crew Licensing, Medicals & Recurrent Training',
    '24/7 Operations Control Center (OCC)', 'No Sub-Charter without Prior Consent Clause',
    'Master Charter Broker Agreement Signed'
  ].map((docType, i) => ({ id: `doc-${i + 1}`, docType, status: 'pass' }));

  const operators = await Operator.insertMany([
    {
      legalName: 'VistaJet Aviation Malta Ltd', tradingName: 'VistaJet',
      aocNumber: 'MT-03', aocAuthority: 'TM-CAD (Transport Malta)', aocExpiry: '2027-11-30',
      baseIcao: 'LMML', salesContact: 'Hélène de Courcy', salesEmail: 'charter@vistajet.com',
      opsPhone: '+356 2125 6000', opsEmail: 'ops@vistajet.com', status: 'approved',
      insuranceExpiry: '2027-05-15', safetyRating: 'ARGUS Platinum', safetyRatingProvider: 'ARGUS International',
      notes: 'Preferred heavy and ultra-long range fleet operator. Global coverage guaranteed.',
      qualificationChecklist: stdChecklist
    },
    {
      legalName: 'GlobeAir AG', tradingName: 'GlobeAir',
      aocNumber: 'A-123', aocAuthority: 'Austro Control (Austria)', aocExpiry: '2026-11-20',
      baseIcao: 'LOWL', salesContact: 'Bernhard Mayr', salesEmail: 'sales@globeair.com',
      opsPhone: '+43 7221 727 400', opsEmail: 'ops@globeair.com', status: 'approved_with_conditions',
      insuranceExpiry: '2026-11-28', safetyRating: 'IS-BAO Stage 3', safetyRatingProvider: 'IBAC',
      notes: 'Approved for Citation Mustang fleet only. Subject to annual insurance update renewal.',
      qualificationChecklist: stdChecklist.map((d, i) => i === 3 ? { ...d, status: 'pending', notes: 'Renewal policy pending receipt' } : d)
    }
  ]);
  console.log(`🏢 Created ${operators.length} operators`);

  // ─── Flight Bookings ─────────────────────────────────────
  const bookingsData = require('../seed/initialBookingsData.json');
  const seededBookings = await Booking.insertMany(bookingsData);
  console.log(`✈️  Created ${seededBookings.length} initial flight bookings`);

  // ─── Sample Notifications ──────────────────────────────
  await Notification.insertMany([
    { userEmail: 'superadmin@orbelo.com', type: 'warning', title: 'AOC Expiry Warning', message: 'GlobeAir AG AOC expires in 15 days. Renewal verification required.', read: false, entityType: 'operator' },
    { userEmail: 'superadmin@orbelo.com', type: 'info', title: 'New Agent RFQ Received', message: 'Marcus Vance submitted a quote request for LSGG ⇄ LIMJ.', read: false, entityType: 'request' },
    { userEmail: 'superadmin@orbelo.com', type: 'success', title: 'Wire Transfer Verified', message: 'Payment of €18,450.00 received for Trip PEU842-001.', read: true, entityType: 'payment' }
  ]);
  console.log('🔔 Created sample notifications');

  // ─── Seed Audit ────────────────────────────────────────
  await AuditLog.insertMany([
    { timestamp: new Date(), userEmail: 'superadmin@orbelo.com', userName: 'Maximilian von Bern', action: 'SEED_COMPLETED', entityType: 'system', entityId: 'SEED', details: 'Database seeded with initial Orbelo data' }
  ]);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🔑 Login credentials (all use password: orbelo2026!):');
  console.log('  Super Admin: superadmin@orbelo.com');
  console.log('  Admin:       admin@orbelo.com');
  console.log('  Finance:     finance@orbelo.com');
  console.log('  Operations:  ops@orbelo.com');
  console.log('  Agent:       agent@orbelo.com');

  if (isDirect && require.main === module) {
    await mongoose.connection.close();
  }

  return { success: true, users: users.length, aircraft: aircraft.length };
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };

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
const Message = require('../models/Message');
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

    // Ensure initial communications messages exist
    const existingMessages = await Message.countDocuments();
    if (existingMessages === 0) {
      console.log('💬 Seeding initial communication messages...');
      await Message.insertMany([
        {
          id: 'msg-1001',
          channel: 'operations',
          senderName: 'David Schneider',
          senderEmail: 'ops@orbelo.com',
          senderRole: 'operations',
          content: 'Eurocontrol CFMU slot issued for PEU842-001 (LSGG → LIMJ). CTOT is confirmed at 11:24z. Ground handling at Genoa AGS notified.',
          tripNumber: 'PEU842-001',
          readBy: [{ userEmail: 'ops@orbelo.com', readAt: new Date() }],
        },
        {
          id: 'msg-1002',
          channel: 'operations',
          senderName: 'Maximilian von Bern',
          senderEmail: 'superadmin@orbelo.com',
          senderRole: 'super_admin',
          content: 'Excellent. Please verify crew FDP limits for Captain Audrain prior to departure.',
          tripNumber: 'PEU842-001',
          readBy: [{ userEmail: 'superadmin@orbelo.com', readAt: new Date() }],
        },
        {
          id: 'msg-1003',
          channel: 'broker_desk',
          senderName: 'Marcus Vance',
          senderEmail: 'agent@orbelo.com',
          senderRole: 'agent',
          content: 'Hello Operations Team! Submitting quotation request for Lord Julian Sterling: London Luton (EGGW) → Nice (LFMN) for 4 VIP passengers. Challenger 350 or Citation Latitude preferred.',
          requestId: 'req-101',
          readBy: [{ userEmail: 'agent@orbelo.com', readAt: new Date() }],
        },
        {
          id: 'msg-1004',
          channel: 'broker_desk',
          senderName: 'Capt. Alexander Vance',
          senderEmail: 'admin@orbelo.com',
          senderRole: 'admin',
          content: 'Hi Marcus, quote PEU603-001 has been compiled with Citation Latitude (OE-LGT) at €31,800 all-inclusive. Document attached below.',
          requestId: 'req-101',
          tripNumber: 'PEU603-001',
          attachments: [
            {
              name: 'Official_Quotation_PEU603-001.pdf',
              type: 'quotation',
              tripNumber: 'PEU603-001',
              docType: 'quotation',
              fileSize: '284 KB',
            },
          ],
          readBy: [{ userEmail: 'admin@orbelo.com', readAt: new Date() }],
        },
        {
          id: 'msg-1005',
          channel: 'finance',
          senderName: 'Elena Rostova',
          senderEmail: 'finance@orbelo.com',
          senderRole: 'finance',
          content: 'Wire transfer of €13,320.45 received from Brinkmann Global Capital for invoice #00106020. Payment status updated to Fully Paid.',
          tripNumber: 'PEU842-001',
          attachments: [
            {
              name: 'Tax_Invoice_00106020.pdf',
              type: 'invoice',
              tripNumber: 'PEU842-001',
              docType: 'invoice',
              fileSize: '210 KB',
            },
          ],
          readBy: [{ userEmail: 'finance@orbelo.com', readAt: new Date() }],
        },
        {
          id: 'msg-1006',
          channel: 'client_services',
          senderName: 'Sophia Laurent',
          senderEmail: 'sophia@orbelo.com',
          senderRole: 'agent',
          content: 'Client has requested onboard catering update: 1 bottle Dom Pérignon Vintage 2013 and gluten-free canapés. Please coordinate with Signature Flight Support.',
          requestId: 'req-102',
          readBy: [{ userEmail: 'sophia@orbelo.com', readAt: new Date() }],
        },
        {
          id: 'msg-1007',
          channel: 'direct',
          senderName: 'Capt. Alexander Vance',
          senderEmail: 'admin@orbelo.com',
          senderRole: 'admin',
          recipientName: 'Marcus Vance',
          recipientEmail: 'agent@orbelo.com',
          recipientRole: 'agent',
          content: 'Welcome to the dispatch channel Marcus. Your broker credentials and 2,000 sourcing tokens have been configured. Let me know if you need assistance with the Nice routing.',
          readBy: [{ userEmail: 'admin@orbelo.com', readAt: new Date() }, { userEmail: 'agent@orbelo.com', readAt: new Date() }],
        },
        {
          id: 'msg-1008',
          channel: 'direct',
          senderName: 'Marcus Vance',
          senderEmail: 'agent@orbelo.com',
          senderRole: 'agent',
          recipientName: 'Capt. Alexander Vance',
          recipientEmail: 'admin@orbelo.com',
          recipientRole: 'admin',
          content: 'Thank you Captain Vance! Sourcing quotes on Avinode now. Will attach the formal quotation once ready.',
          readBy: [{ userEmail: 'agent@orbelo.com', readAt: new Date() }, { userEmail: 'admin@orbelo.com', readAt: new Date() }],
        },
      ]);
      console.log('✅ Seeded initial communication messages!');
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
    { name: 'Maximilian von Bern', email: 'superadmin@orbelo.com', passwordHash, role: 'super_admin', isActive: true, title: 'Chief Executive Officer & Super Admin', company: 'Orbelo Aviation Management GmbH', location: 'Linz, Austria' },
    { name: 'Capt. Alexander Vance', email: 'admin@orbelo.com', passwordHash, role: 'admin', isActive: true, title: 'Flight Operations Director', company: 'Orbelo Aviation Management GmbH', location: 'Vienna, Austria' },
    { name: 'Elena Rostova', email: 'finance@orbelo.com', passwordHash, role: 'finance', isActive: true, title: 'Chief Financial Officer', company: 'Orbelo Aviation Management GmbH', location: 'Zurich, Switzerland' },
    { name: 'David Schneider', email: 'ops@orbelo.com', passwordHash, role: 'operations', isActive: true, title: 'Flight Dispatch & OCC', company: 'Orbelo Aviation Management GmbH', location: 'Linz, Austria' },
    {
      name: 'Marcus Vance',
      email: 'agent@orbelo.com',
      passwordHash,
      role: 'agent',
      isActive: true,
      title: 'Executive Charter Broker',
      company: 'Vance Aviation Advisory Ltd',
      location: 'Geneva / London',
      tokens: 2000,
      tokenTier: 'standard',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
      tokenTransactions: [
        {
          id: 'tx-seed-1',
          type: 'credit',
          amount: 2000,
          balanceAfter: 2000,
          action: 'subscription',
          description: 'Standard Broker Access Subscription (2,000 Tokens)',
          currency: 'GBP',
          pricePaid: 500,
          createdAt: new Date(),
        }
      ]
    },
    {
      name: 'Sophia Laurent',
      email: 'sophia@orbelo.com',
      passwordHash,
      role: 'agent',
      isActive: true,
      title: 'Senior Charter Broker',
      company: 'Laurent Private Jets Monaco',
      location: 'Monaco / Nice',
      tokens: 2000,
      tokenTier: 'standard',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
      tokenTransactions: [
        {
          id: 'tx-seed-2',
          type: 'credit',
          amount: 2000,
          balanceAfter: 2000,
          action: 'subscription',
          description: 'Standard Broker Access Subscription (2,000 Tokens)',
          currency: 'USD',
          pricePaid: 600,
          createdAt: new Date(),
        }
      ]
    },
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
      legalName: 'Zenith Executive Aviation Ltd', tradingName: 'Zenith Aviation',
      aocNumber: 'UK-AOC-7482', aocAuthority: 'Civil Aviation Authority (UK CAA)', aocExpiry: '2027-11-20',
      baseIcao: 'EGKB', salesContact: 'Jonathan Sterling', salesEmail: 'charter@zenithaviation.co.uk',
      opsPhone: '+44 1959 578 400', opsEmail: 'dispatch@zenithaviation.co.uk', status: 'approved_with_conditions',
      insuranceExpiry: '2027-04-15', safetyRating: 'IS-BAO Stage 3', safetyRatingProvider: 'IBAC',
      notes: 'Approved for light and midsize jet operations. Continuous airworthiness verified.',
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
    { userEmail: 'superadmin@orbelo.com', type: 'warning', title: 'AOC Expiry Warning', message: 'Zenith Executive Aviation AOC expires in 15 days. Renewal verification required.', read: false, entityType: 'operator' },
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

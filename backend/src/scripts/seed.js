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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orbelo';

const seed = async () => {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Aircraft.deleteMany({}), Client.deleteMany({}),
    Operator.deleteMany({}), Booking.deleteMany({}), AgentRequest.deleteMany({}),
    Notification.deleteMany({}), AuditLog.deleteMany({})
  ]);
  console.log('🧹 Cleared existing data');

  // ─── Users ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('orbelo2026!', 12);
  const users = await User.insertMany([
    { name: 'Maximilian von Bern', email: 'superadmin@orbelo.com', passwordHash, role: 'super_admin', isActive: true },
    { name: 'Capt. Alexander Vance', email: 'admin@orbelo.com', passwordHash, role: 'admin', isActive: true },
    { name: 'Elena Rostova', email: 'finance@orbelo.com', passwordHash, role: 'finance', isActive: true },
    { name: 'David Schneider', email: 'ops@orbelo.com', passwordHash, role: 'operations', isActive: true },
    { name: 'Marcus Vance', email: 'agent@orbelo.com', passwordHash, role: 'agent', isActive: true },
    { name: 'Sophia Laurent', email: 'sophia@orbelo.com', passwordHash, role: 'agent', isActive: true },
  ]);
  console.log(`👤 Created ${users.length} users`);

  // ─── Aircraft ──────────────────────────────────────────
  const aircraft = await Aircraft.insertMany([
    {
      name: 'Cessna Citation Mustang', manufacturer: 'Cessna', category: 'light',
      categoryLabel: 'Entry Level Jet', registration: 'OE-FFB',
      tagline: 'The quintessential European private air taxi.',
      description: 'Compact, whisper-quiet cabin with 4 club-arranged leather seats, forward mini-bar, and high-efficiency Pratt & Whitney turbofans.',
      passengers: 4, passengersLabel: '4 passengers', range: 1200, rangeLabel: '1,200 nm',
      cabinHeight: '1.37 m', cabinWidth: '1.40 m', baggageVolume: '57 cu ft', cruiseSpeed: '340 ktas',
      yearOfManufacture: '2008 - 2010', yearOfRefurbishment: '2023', pricePerHour: 2450,
      toilette: true, smokingCabin: false,
      imageExterior: '/images/fleet/citation-cj3-plus/exterior.jpg',
      imageInterior: '/images/fleet/citation-cj3-plus/interior.jpg'
    },
    {
      name: 'Embraer Phenom 100', manufacturer: 'Embraer', category: 'light',
      categoryLabel: 'Very Light Jet', registration: 'F-HSBL',
      tagline: 'BMW Designworks cabin elegance and oversized windows.',
      description: 'Designed with BMW DesignworksUSA, offering class-leading cabin headroom, generous luggage space, and fully enclosed private rear lavatory.',
      passengers: 5, passengersLabel: '4-5 passengers', range: 1178, rangeLabel: '1,178 nm',
      cabinHeight: '1.50 m', cabinWidth: '1.55 m', baggageVolume: '70 cu ft', cruiseSpeed: '390 ktas',
      yearOfManufacture: 2015, yearOfRefurbishment: 2024, pricePerHour: 2800,
      toilette: true, smokingCabin: false,
      imageExterior: '/images/fleet/phenom-300e/exterior.jpg',
      imageInterior: '/images/fleet/phenom-300e/interior.jpg'
    },
    {
      name: 'Cessna Citation CJ3+', manufacturer: 'Cessna', category: 'light',
      categoryLabel: 'Light Jet', registration: 'OE-FDT',
      tagline: 'Agile, efficient and ready for quick city-pair jumps.',
      description: 'Combines impressive range with exceptional efficiency. Perfect for European hops with quiet cabin and club seating.',
      passengers: 6, passengersLabel: '6-7 guests', range: 2040, rangeLabel: '2,040 nm',
      cabinHeight: '1.45 m', cabinWidth: '1.48 m', baggageVolume: '59 cu ft', cruiseSpeed: '416 ktas',
      yearOfManufacture: 2018, yearOfRefurbishment: 2024, pricePerHour: 3200,
      toilette: true, smokingCabin: false,
      imageExterior: '/images/fleet/citation-cj3-plus/exterior.jpg',
      imageInterior: '/images/fleet/citation-cj3-plus/interior.jpg'
    },
    {
      name: 'Bombardier Challenger 350', manufacturer: 'Bombardier', category: 'super-midsize',
      categoryLabel: 'Super-Midsize Jet', registration: '9H-VJB',
      tagline: 'Best-selling business jet of the last decade.',
      description: 'True stand-up cabin, flat floor design, Ka-band high-speed connectivity, and unmatched coast-to-coast range.',
      passengers: 9, passengersLabel: '9-10 guests', range: 3200, rangeLabel: '3,200 nm',
      cabinHeight: '1.83 m', cabinWidth: '2.19 m', baggageVolume: '106 cu ft', cruiseSpeed: '470 ktas',
      yearOfManufacture: 2020, yearOfRefurbishment: 2025, pricePerHour: 5800,
      toilette: true, smokingCabin: false,
      imageExterior: '/images/fleet/challenger-350/exterior.jpg',
      imageInterior: '/images/fleet/challenger-350/interior.jpg'
    },
    {
      name: 'Gulfstream G650ER', manufacturer: 'Gulfstream', category: 'ultra-long-range',
      categoryLabel: 'Ultra-Long-Range Flagship', registration: 'N650GF',
      tagline: 'The world standard in ultra-luxury global transit.',
      description: 'Fly non-stop between London and Singapore, or New York and Dubai. Features 16 panoramic oval windows, dedicated stateroom, and 100% fresh air replenishment.',
      passengers: 14, passengersLabel: '14-16 guests', range: 7500, rangeLabel: '7,500 nm',
      cabinHeight: '1.96 m', cabinWidth: '2.59 m', baggageVolume: '195 cu ft', cruiseSpeed: '516 ktas',
      yearOfManufacture: 2022, yearOfRefurbishment: 2025, pricePerHour: 11500,
      toilette: true, smokingCabin: false,
      imageExterior: '/images/fleet/gulfstream-g650er/exterior.jpg',
      imageInterior: '/images/fleet/gulfstream-g650er/interior.jpg'
    }
  ]);
  console.log(`✈️  Created ${aircraft.length} aircraft`);

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

  // ─── Sample Notifications ──────────────────────────────
  await Notification.insertMany([
    { type: 'warning', title: 'AOC Expiry Warning', message: 'GlobeAir AG AOC expires in 15 days. Renewal verification required.', read: false, entityType: 'operator' },
    { type: 'info', title: 'New Agent RFQ Received', message: 'Marcus Vance submitted a quote request for LSGG ⇄ LIMJ.', read: false, entityType: 'request' },
    { type: 'success', title: 'Wire Transfer Verified', message: 'Payment of €18,450.00 received for Trip PEU842-001.', read: true, entityType: 'payment' }
  ]);
  console.log('🔔 Created sample notifications');

  // ─── Seed Audit ────────────────────────────────────────
  await AuditLog.insertMany([
    { timestamp: new Date(), userEmail: 'admin@orbelo.com', userName: 'Capt. Alexander Vance', action: 'SEED_COMPLETED', entityType: 'System', entityId: 'SEED', details: 'Database seeded with initial Orbelo data' }
  ]);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🔑 Login credentials (all use password: orbelo2026!):');
  console.log('  Super Admin: superadmin@orbelo.com');
  console.log('  Admin:       admin@orbelo.com');
  console.log('  Finance:     finance@orbelo.com');
  console.log('  Operations:  ops@orbelo.com');
  console.log('  Agent:       agent@orbelo.com');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

const PDFDocument = require('pdfkit');

// Brand colors
const COLORS = {
  primary: '#0B101A',      // Premium Aviation Charcoal/Navy
  brandOrange: '#FF6B00',  // Orbelo Signature Orange
  gold: '#C9A052',         // Orbelo Executive Gold
  gray: '#64748b',
  lightGray: '#f8fafc',
  dark: '#0f172a',
  white: '#ffffff',
  border: '#e2e8f0',
};

const FONTS = {
  normal: 'Helvetica',
  bold: 'Helvetica-Bold',
  oblique: 'Helvetica-Oblique',
};

/**
 * Create a base PDF document with standard Orbelo branding
 */
const createBaseDocument = () => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Author: 'Orbelo Charter',
      Creator: 'Orbelo Flight Management System',
      Producer: 'Orbelo Engine',
    },
  });
  return doc;
};

/**
 * Draw Orbelo header on a page
 */
const drawHeader = (doc, title) => {
  // Header background
  doc.rect(0, 0, doc.page.width, 85).fill(COLORS.primary);

  // Orbelo Brand Name in Signature Orange
  doc.font(FONTS.bold).fontSize(22).fillColor(COLORS.brandOrange)
    .text('ORBELO', 50, 24, { align: 'left' });

  doc.font(FONTS.normal).fontSize(8).fillColor('#94a3b8')
    .text('PRIVATE JET AVIATION', 50, 52, { align: 'left' });

  // Document title on the right
  doc.font(FONTS.bold).fontSize(14).fillColor(COLORS.white)
    .text(title, 0, 32, { align: 'right', width: doc.page.width - 50 });

  doc.y = 105;
  doc.fillColor(COLORS.dark);
};

/**
 * Draw a section header without coordinate collision
 */
const drawSectionHeader = (doc, title) => {
  if (doc.y > doc.page.height - 110) {
    doc.addPage();
    doc.y = 50;
  }
  const topY = doc.y + 6;
  doc.rect(50, topY, doc.page.width - 100, 22).fill(COLORS.lightGray);
  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.primary)
    .text(title, 60, topY + 6);
  doc.y = topY + 28;
  doc.fillColor(COLORS.dark);
};

/**
 * Draw a detail row (label: value) with clean auto-advancing Y
 */
const drawDetailRow = (doc, label, value, options = {}) => {
  if (doc.y > doc.page.height - 60) {
    doc.addPage();
    doc.y = 50;
  }
  const y = doc.y;
  doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.gray)
    .text(label, 50, y, { width: 155 });
  doc.font(options.bold ? FONTS.bold : FONTS.normal)
    .fontSize(8.5)
    .fillColor(options.color || COLORS.dark)
    .text(String(value ?? ''), 215, y, { width: 330 });
  doc.y = y + 14;
};

/**
 * Draw a table with clean geometry
 */
const drawTable = (doc, headers, rows, startY) => {
  const colWidths = headers.map((h) => h.width || 80);
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  let y = startY || doc.y;
  const rowHeight = 20;

  if (y > doc.page.height - 100) {
    doc.addPage();
    y = 50;
  }

  // Header row
  doc.rect(50, y, tableWidth, rowHeight).fill(COLORS.primary);
  let x = 50;
  headers.forEach((h, i) => {
    doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.white)
      .text(h.label, x + 4, y + 6, { width: colWidths[i] - 8 });
    x += colWidths[i];
  });
  y += rowHeight;

  // Data rows
  rows.forEach((row, rowIdx) => {
    if (y > doc.page.height - 50) {
      doc.addPage();
      y = 50;
    }
    const bg = rowIdx % 2 === 0 ? COLORS.white : COLORS.lightGray;
    doc.rect(50, y, tableWidth, rowHeight).fill(bg);

    x = 50;
    row.forEach((cell, colIdx) => {
      doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
        .text(String(cell ?? ''), x + 4, y + 6, { width: colWidths[colIdx] - 8 });
      x += colWidths[colIdx];
    });

    // Row border
    doc.rect(50, y, tableWidth, rowHeight).stroke(COLORS.border);
    y += rowHeight;
  });

  doc.y = y + 10;
};

/**
 * Draw footer
 */
const drawFooter = (doc, page, totalPages) => {
  const y = doc.page.height - 45;
  doc.rect(0, y - 5, doc.page.width, 50).fill(COLORS.lightGray);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.gray)
    .text('Orbelo Jet Management GmbH • Executive Charter • All rights reserved', 50, y + 6, { align: 'center', width: doc.page.width - 100 });
  doc.text(`Page ${page} of ${totalPages}`, 50, y + 16, { align: 'right', width: doc.page.width - 100 });
};

/**
 * Convert doc stream to buffer
 */
const docToBuffer = (doc) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};

const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '';
  return `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Helpers to normalize flight leg and pricing data from either DB model or Frontend state
 */
const getOriginText = (leg) => {
  if (!leg) return 'TBD';
  if (leg.from && leg.fromIcao) return `${leg.from} (${leg.fromIcao})`;
  if (leg.origin) {
    const name = leg.origin.name || leg.origin.city || '';
    const code = leg.origin.icao || leg.origin.iata || '';
    return code ? `${name} (${code})` : name || 'TBD';
  }
  return leg.from || leg.fromIcao || 'TBD';
};

const getDestinationText = (leg) => {
  if (!leg) return 'TBD';
  if (leg.to && leg.toIcao) return `${leg.to} (${leg.toIcao})`;
  if (leg.destination) {
    const name = leg.destination.name || leg.destination.city || '';
    const code = leg.destination.icao || leg.destination.iata || '';
    return code ? `${name} (${code})` : name || 'TBD';
  }
  return leg.to || leg.toIcao || 'TBD';
};

const getFlightDate = (leg) => {
  return leg.flightDate || leg.departureDate || 'TBD';
};

const getFlightTime = (leg) => {
  return leg.departureTimeLocal || leg.departureTime || 'TBC';
};

/**
 * Generate a PDF Quotation
 */
const generateQuotationPDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, 'CHARTER QUOTATION');

  const bufferPromise = docToBuffer(doc);

  // Quote info block
  const tripNum = booking.tripNumber || booking.quoteReference || 'ORB-QUOTE';
  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.gold)
    .text(`Quote Reference: ${tripNum}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.gray)
    .text(`Date: ${booking.contractDate || new Date().toLocaleDateString('en-GB')}`, { align: 'right' })
    .text(`Valid Until: ${booking.quoteExpirationDate || '48 hours from issue'}`, { align: 'right' });
  doc.y += 8;

  // Client details
  drawSectionHeader(doc, 'CLIENT DETAILS');
  const c = booking.client || {};
  drawDetailRow(doc, 'Name', c.fullName || 'Private Client');
  if (c.companyName) drawDetailRow(doc, 'Company', c.companyName);
  if (c.email) drawDetailRow(doc, 'Email', c.email);
  if (c.phone) drawDetailRow(doc, 'Phone', c.phone);
  if (c.vatNumber) drawDetailRow(doc, 'Tax / VAT Number', c.vatNumber);

  // Flight details
  drawSectionHeader(doc, 'FLIGHT ROUTING');
  const legs = booking.legs || [];
  legs.forEach((leg, i) => {
    if (legs.length > 1) {
      doc.font(FONTS.bold).fontSize(8.5).fillColor(COLORS.gold)
        .text(`Leg ${i + 1}:`, 50, doc.y);
      doc.y += 12;
    }
    drawDetailRow(doc, 'Origin', getOriginText(leg));
    drawDetailRow(doc, 'Destination', getDestinationText(leg));
    drawDetailRow(doc, 'Departure Date', getFlightDate(leg));
    drawDetailRow(doc, 'Departure Time', getFlightTime(leg));
    drawDetailRow(doc, 'Passengers', `${leg.paxCount || 1} VIPs`);
    if (leg.distanceNm) drawDetailRow(doc, 'Distance', `${leg.distanceNm} nm`);
    if (leg.flightTimeFormatted || leg.flightTimeMinutes) {
      const ft = leg.flightTimeFormatted || `${Math.floor(leg.flightTimeMinutes / 60)}h ${leg.flightTimeMinutes % 60}m`;
      drawDetailRow(doc, 'Est. Flight Time', ft);
    }
    doc.y += 4;
  });

  // Aircraft
  if (booking.aircraft?.name) {
    drawSectionHeader(doc, 'AIRCRAFT SPECIFICATIONS');
    const a = booking.aircraft;
    drawDetailRow(doc, 'Aircraft', a.name);
    if (a.manufacturer) drawDetailRow(doc, 'Manufacturer', a.manufacturer);
    if (a.categoryLabel || a.category) {
      drawDetailRow(doc, 'Category', a.categoryLabel || (a.category || '').replace(/-/g, ' '));
    }
    if (a.registration) drawDetailRow(doc, 'Registration', a.registration);
    if (a.passengers) drawDetailRow(doc, 'Max Passengers', `${a.passengers} seats`);
    if (a.cruiseSpeed) drawDetailRow(doc, 'Cruise Speed', a.cruiseSpeed);
    if (a.yearOfManufacture) drawDetailRow(doc, 'Year of Manufacture', a.yearOfManufacture);
  }

  // Pricing
  const p = booking.pricing || {};
  drawSectionHeader(doc, 'PRICING BREAKDOWN');
  const currency = p.currency || 'USD';
  const totalAmount = p.totalFlightPrice ?? p.grandTotal ?? 0;
  const baseFlightPrice = p.flightPrice ?? p.baseCharterCost ?? totalAmount;

  const pricingRows = [
    ['Base Flight Charter Rate', formatCurrency(baseFlightPrice, currency)],
  ];
  if (p.airportFees || p.landingFees) {
    pricingRows.push(['Airport & Navigation Fees', formatCurrency(p.airportFees || (p.landingFees || 0) + (p.handlingFees || 0), currency)]);
  }
  if (p.passengerFees || p.inboundPassengerTax) {
    pricingRows.push(['Passenger Terminal & Handling Fees', formatCurrency(p.passengerFees || p.inboundPassengerTax, currency)]);
  }
  if (p.additionalServicesTotal || p.additionalServicesCost) {
    pricingRows.push(['Additional Concierge Services', formatCurrency(p.additionalServicesTotal || p.additionalServicesCost, currency)]);
  }
  if (p.vatAmount > 0) {
    pricingRows.push([`VAT (${p.vatRate}%)`, formatCurrency(p.vatAmount, currency)]);
  }

  drawTable(doc,
    [{ label: 'Item Description', width: 320 }, { label: 'Amount', width: 145 }],
    pricingRows
  );

  // Grand Total Box
  const totalY = doc.y + 6;
  doc.rect(50, totalY, doc.page.width - 100, 32).fill(COLORS.primary);
  doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.gold)
    .text(`TOTAL CHARTER FLIGHT PRICE: ${formatCurrency(totalAmount, currency)}`, 58, totalY + 10, {
      align: 'right',
      width: doc.page.width - 108,
    });
  doc.y = totalY + 42;

  // Terms
  drawSectionHeader(doc, 'TERMS & CARRIAGE CONDITIONS');
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.gray)
    .text('1. This quotation is valid for 48 hours from the date of issue.', 50)
    .text('2. All flights are operated under applicable commercial air operator certificates (EC 2111/2005).')
    .text('3. Payment terms: 50% deposit required upon confirmation, balance due prior to departure.')
    .text('4. Baggage is subject to aircraft hold volume and weight limits.');

  drawFooter(doc, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate Invoice PDF
 */
const generateInvoicePDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, 'TAX INVOICE');
  const bufferPromise = docToBuffer(doc);

  const invoiceNum = booking.invoiceNumber || booking.tripNumber;
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.gold)
    .text(`Invoice #: ${invoiceNum}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.gray)
    .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' })
    .text(`Trip Reference: ${booking.tripNumber}`, { align: 'right' })
    .text(`Payment Due: ${booking.paymentDueDate || 'Upon receipt'}`, { align: 'right' });
  doc.y += 8;

  // Bill To
  drawSectionHeader(doc, 'BILL TO');
  const c = booking.client || {};
  drawDetailRow(doc, 'Name', c.fullName, { bold: true });
  if (c.companyName) drawDetailRow(doc, 'Company', c.companyName);
  if (c.streetAddress || c.address) drawDetailRow(doc, 'Address', c.streetAddress || c.address);
  if (c.email) drawDetailRow(doc, 'Email', c.email);
  if (c.vatNumber) drawDetailRow(doc, 'VAT Number', c.vatNumber);

  // Service details
  drawSectionHeader(doc, 'SERVICE DETAILS');
  const legs = booking.legs || [];
  legs.forEach((leg, i) => {
    const prefix = legs.length > 1 ? `Leg ${i + 1}: ` : '';
    drawDetailRow(doc, `${prefix}Route`, `${getOriginText(leg)} → ${getDestinationText(leg)}`);
    drawDetailRow(doc, `${prefix}Date`, getFlightDate(leg));
  });
  if (booking.aircraft?.name) {
    drawDetailRow(doc, 'Aircraft', `${booking.aircraft.name} ${booking.aircraft.registration ? '(' + booking.aircraft.registration + ')' : ''}`);
  }

  // Invoice line items
  const p = booking.pricing || {};
  const currency = p.currency || 'USD';
  const totalAmount = p.totalFlightPrice ?? p.grandTotal ?? 0;
  const baseFlightPrice = p.flightPrice ?? p.baseCharterCost ?? totalAmount;

  drawSectionHeader(doc, 'INVOICE LINE ITEMS');
  const lineItems = [
    ['Executive Charter Flight Services', formatCurrency(baseFlightPrice, currency)],
  ];
  if (p.airportFees || p.landingFees) {
    lineItems.push(['Airport, Navigation & Ramp Fees', formatCurrency(p.airportFees || (p.landingFees || 0) + (p.handlingFees || 0), currency)]);
  }
  if (p.passengerFees) {
    lineItems.push(['Passenger Handling & APD Fees', formatCurrency(p.passengerFees, currency)]);
  }
  if (p.additionalServicesTotal || p.additionalServicesCost) {
    lineItems.push(['Additional Concierge Services', formatCurrency(p.additionalServicesTotal || p.additionalServicesCost, currency)]);
  }

  drawTable(doc,
    [{ label: 'Description', width: 320 }, { label: 'Amount', width: 145 }],
    lineItems
  );

  // Totals Box
  const totalY = doc.y + 6;
  doc.rect(50, totalY, doc.page.width - 100, 32).fill(COLORS.primary);
  doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.gold)
    .text(`TOTAL DUE: ${formatCurrency(totalAmount, currency)}`, 58, totalY + 10, {
      align: 'right',
      width: doc.page.width - 108,
    });
  doc.y = totalY + 42;

  // Bank details
  drawSectionHeader(doc, 'PAYMENT & WIRE INSTRUCTIONS');
  doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.dark)
    .text('Bank: Orbelo Aviation Banking (Erste Group Bank)', 50)
    .text('Account Name: Orbelo Jet Management GmbH')
    .text('IBAN: AT42 2011 1845 9201 4402')
    .text('BIC / SWIFT: GIBAATWW')
    .text(`Payment Reference: ${booking.tripNumber} / ${c.fullName || 'Client'}`);

  drawFooter(doc, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate Flight Brief PDF
 */
const generateFlightBriefPDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, 'FLIGHT BRIEF');
  const bufferPromise = docToBuffer(doc);

  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.gold)
    .text(`Trip Reference: ${booking.tripNumber}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.gray)
    .text(`Prepared: ${new Date().toLocaleString('en-GB')}`, { align: 'right' });
  doc.y += 8;

  // Flight information
  drawSectionHeader(doc, 'FLIGHT OPERATIONS SCHEDULE');
  const legs = booking.legs || [];
  legs.forEach((leg, i) => {
    if (legs.length > 1) {
      doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.gold).text(`LEG ${i + 1}`, 50, doc.y);
      doc.y += 12;
    }
    drawDetailRow(doc, 'Origin', getOriginText(leg));
    drawDetailRow(doc, 'Destination', getDestinationText(leg));
    drawDetailRow(doc, 'Departure Date', getFlightDate(leg));
    drawDetailRow(doc, 'Departure Time', getFlightTime(leg));
    drawDetailRow(doc, 'Passengers', `${leg.paxCount || 1} VIPs`);
    if (leg.distanceNm) drawDetailRow(doc, 'Distance', `${leg.distanceNm} nm`);
    if (leg.flightTimeFormatted || leg.flightTimeMinutes) {
      const ft = leg.flightTimeFormatted || `${Math.floor(leg.flightTimeMinutes / 60)}h ${leg.flightTimeMinutes % 60}m`;
      drawDetailRow(doc, 'Flight Time', ft);
    }
    doc.y += 4;
  });

  // Aircraft & Operator
  drawSectionHeader(doc, 'AIRCRAFT & OPERATOR');
  const a = booking.aircraft || {};
  const o = booking.operator || {};
  drawDetailRow(doc, 'Aircraft Type', a.name || 'Executive Jet');
  drawDetailRow(doc, 'Registration', a.registration || 'OE-XXX');
  drawDetailRow(doc, 'Category', a.categoryLabel || a.category || 'Midsize Jet');
  drawDetailRow(doc, 'Max Passengers', `${a.passengers || 8} seats`);
  if (o.legalName) drawDetailRow(doc, 'AOC Operating Carrier', o.legalName);
  if (o.opsPhone) drawDetailRow(doc, 'Operations Dispatch', o.opsPhone);
  if (o.opsEmail) drawDetailRow(doc, 'Ops Email', o.opsEmail);

  // Passenger manifest summary
  drawSectionHeader(doc, 'LEAD PASSENGER DETAILS');
  const c = booking.client || {};
  drawDetailRow(doc, 'Lead Passenger', c.fullName || 'Private Client');
  if (c.email) drawDetailRow(doc, 'Contact Email', c.email);
  if (c.phone) drawDetailRow(doc, 'Phone', c.phone);

  drawFooter(doc, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate Charter Agreement PDF
 */
const generateCharterAgreementPDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, 'CHARTER AGREEMENT');
  const bufferPromise = docToBuffer(doc);

  const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.dark)
    .text(`Agreement Date: ${booking.contractDate || today}`)
    .text(`Reference: ${booking.tripNumber}`);
  doc.y += 8;

  doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.dark)
    .text('This Charter Agreement is entered into between Orbelo Jet Management GmbH and the undersigned client.');
  doc.y += 6;

  // Parties
  drawSectionHeader(doc, 'PARTIES');
  const c = booking.client || {};
  drawDetailRow(doc, 'Charterer', c.fullName || 'Private Client');
  if (c.companyName) drawDetailRow(doc, 'Company', c.companyName);
  if (c.email) drawDetailRow(doc, 'Email', c.email);
  drawDetailRow(doc, 'Carrier Broker', 'Orbelo Jet Management GmbH');

  // Flight details
  drawSectionHeader(doc, 'CHARTER DETAILS');
  (booking.legs || []).forEach((leg, i) => {
    const prefix = booking.legs.length > 1 ? `Leg ${i + 1}: ` : '';
    drawDetailRow(doc, `${prefix}Route`, `${getOriginText(leg)} → ${getDestinationText(leg)}`);
    drawDetailRow(doc, `${prefix}Date`, getFlightDate(leg));
    drawDetailRow(doc, `${prefix}Passengers`, `${leg.paxCount || 1} VIPs`);
  });
  drawDetailRow(doc, 'Aircraft', `${booking.aircraft?.name || 'TBC'}${booking.aircraft?.registration ? ' (' + booking.aircraft.registration + ')' : ''}`);

  // Pricing
  const p = booking.pricing || {};
  const totalAmount = p.totalFlightPrice ?? p.grandTotal ?? 0;
  drawDetailRow(doc, 'Charter Price', formatCurrency(totalAmount, p.currency || 'USD'));
  drawDetailRow(doc, 'Payment Terms', 'As per confirmed invoice schedule');

  // Terms
  drawSectionHeader(doc, 'STANDARD CHARTER TERMS');
  const terms = [
    '1. CHARTER PRICE: The charter price includes aircraft, crew, fuel, standard catering, and landing fees.',
    '2. PAYMENT: 50% deposit upon confirmation, remaining balance due prior to departure.',
    '3. CANCELLATION: Cancellations within 72 hours of departure will incur a 100% cancellation fee.',
    '4. FORCE MAJEURE: Neither party shall be liable for weather disruptions, ATC delays, or regulatory actions.',
  ];

  terms.forEach((term) => {
    doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(term, 50);
    doc.y += 4;
  });

  drawFooter(doc, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate Passenger Manifest PDF
 */
const generatePassengerManifestPDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, 'PASSENGER MANIFEST');
  const bufferPromise = docToBuffer(doc);

  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.gold)
    .text(`Trip Reference: ${booking.tripNumber}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.gray)
    .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' });
  doc.y += 8;

  drawSectionHeader(doc, 'FLIGHT DETAILS');
  (booking.legs || []).forEach((leg, i) => {
    const prefix = booking.legs.length > 1 ? `Leg ${i + 1}: ` : '';
    drawDetailRow(doc, `${prefix}Route`, `${getOriginText(leg)} → ${getDestinationText(leg)}`);
    drawDetailRow(doc, `${prefix}Date`, getFlightDate(leg));
    drawDetailRow(doc, `${prefix}Pax`, `${leg.paxCount || 1}`);
  });
  if (booking.aircraft?.name) {
    drawDetailRow(doc, 'Aircraft', booking.aircraft.name);
  }
  if (booking.aircraft?.registration) {
    drawDetailRow(doc, 'Registration', booking.aircraft.registration);
  }

  drawSectionHeader(doc, 'PASSENGER LIST');
  const paxCount = booking.legs?.[0]?.paxCount || 1;
  const paxRows = Array.from({ length: paxCount }, (_, i) => [
    i + 1,
    i === 0 ? (booking.client?.fullName || 'Lead Passenger') : 'Guest Passenger',
    'Verified On File',
    'Verified',
    'Standard VIP',
  ]);

  drawTable(doc,
    [
      { label: '#', width: 30 },
      { label: 'Full Name', width: 160 },
      { label: 'Passport / ID', width: 100 },
      { label: 'Status', width: 90 },
      { label: 'Category', width: 85 },
    ],
    paxRows
  );

  drawFooter(doc, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate Credit Note PDF
 */
const generateCreditNotePDF = async (booking, creditAmountOrObj, reason = '') => {
  let creditAmount = creditAmountOrObj;
  if (typeof creditAmountOrObj === 'object' && creditAmountOrObj !== null) {
    creditAmount = creditAmountOrObj.creditAmount;
    reason = creditAmountOrObj.reason || reason;
  }
  const doc = createBaseDocument();
  drawHeader(doc, 'CREDIT NOTE');
  const bufferPromise = docToBuffer(doc);

  const creditNoteNum = `CN-${booking.tripNumber}-${Date.now().toString().slice(-6)}`;
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.gold)
    .text(`Credit Note #: ${creditNoteNum}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.gray)
    .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' })
    .text(`Original Trip: ${booking.tripNumber}`, { align: 'right' });
  doc.y += 8;

  drawSectionHeader(doc, 'CREDIT TO');
  const c = booking.client || {};
  drawDetailRow(doc, 'Name', c.fullName || 'Client', { bold: true });
  if (c.companyName) drawDetailRow(doc, 'Company', c.companyName);
  if (c.email) drawDetailRow(doc, 'Email', c.email);

  drawSectionHeader(doc, 'CREDIT DETAILS');
  const p = booking.pricing || {};
  drawDetailRow(doc, 'Original Reference', booking.invoiceNumber || booking.tripNumber);
  drawDetailRow(doc, 'Reason', reason || 'Service adjustment / cancellation credit');

  const totalY = doc.y + 6;
  doc.rect(50, totalY, doc.page.width - 100, 32).fill(COLORS.primary);
  doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.gold)
    .text(`CREDIT AMOUNT: ${formatCurrency(creditAmount, p.currency || 'USD')}`, 58, totalY + 10, {
      align: 'right',
      width: doc.page.width - 108,
    });
  doc.y = totalY + 42;

  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text('This credit note will be credited to your account or refunded per your instructions.');

  drawFooter(doc, 1, 1);
  doc.end();
  return bufferPromise;
};

module.exports = {
  generateQuotationPDF,
  generateQuotationPdf: generateQuotationPDF,
  generateQuotePdf: generateQuotationPDF,
  generateInvoicePDF,
  generateInvoicePdf: generateInvoicePDF,
  generateFlightBriefPDF,
  generateFlightBriefPdf: generateFlightBriefPDF,
  generateCharterAgreementPDF,
  generateCharterAgreementPdf: generateCharterAgreementPDF,
  generatePassengerManifestPDF,
  generatePassengerManifestPdf: generatePassengerManifestPDF,
  generateCreditNotePDF,
  generateCreditNotePdf: generateCreditNotePDF,
};

const PDFDocument = require('pdfkit');

// Brand colors
const COLORS = {
  primary: '#1a1a2e',
  gold: '#c9a84c',
  gray: '#64748b',
  lightGray: '#f1f5f9',
  dark: '#1e293b',
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
      Creator: 'Orbelo Backend v1.0',
      Producer: 'PDFKit',
    },
  });
  return doc;
};

/**
 * Draw Orbelo header on a page
 */
const drawHeader = (doc, title) => {
  // Header background
  doc.rect(0, 0, doc.page.width, 100).fill(COLORS.primary);

  // Company name
  doc.font(FONTS.bold).fontSize(24).fillColor(COLORS.gold)
    .text('ORBELO', 50, 30, { align: 'left' });

  doc.font(FONTS.normal).fontSize(9).fillColor('#94a3b8')
    .text('PRIVATE JET CHARTER', 50, 60, { align: 'left' });

  // Document title on the right
  doc.font(FONTS.bold).fontSize(14).fillColor(COLORS.white)
    .text(title, 0, 42, { align: 'right', width: doc.page.width - 50 });

  doc.moveDown(1);
  doc.y = 120;
  doc.fillColor(COLORS.dark);
};

/**
 * Draw a section header
 */
const drawSectionHeader = (doc, title) => {
  doc.moveDown(0.5);
  doc.rect(50, doc.y, doc.page.width - 100, 24).fill(COLORS.lightGray);
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.primary)
    .text(title, 58, doc.y - 20);
  doc.moveDown(0.3);
  doc.fillColor(COLORS.dark);
};

/**
 * Draw a detail row (label: value)
 */
const drawDetailRow = (doc, label, value, options = {}) => {
  const y = doc.y;
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
    .text(label, 50, y, { width: 160 });
  doc.font(options.bold ? FONTS.bold : FONTS.normal)
    .fontSize(9)
    .fillColor(options.color || COLORS.dark)
    .text(String(value || ''), 220, y, { width: 300 });
  doc.moveDown(0.4);
};

/**
 * Draw a table
 */
const drawTable = (doc, headers, rows, startY) => {
  const colWidths = headers.map((h) => h.width || 80);
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  let y = startY || doc.y;
  const rowHeight = 22;

  // Header row
  doc.rect(50, y, tableWidth, rowHeight).fill(COLORS.primary);
  let x = 50;
  headers.forEach((h, i) => {
    doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.white)
      .text(h.label, x + 4, y + 7, { width: colWidths[i] - 8 });
    x += colWidths[i];
  });
  y += rowHeight;

  // Data rows
  rows.forEach((row, rowIdx) => {
    const bg = rowIdx % 2 === 0 ? COLORS.white : COLORS.lightGray;
    doc.rect(50, y, tableWidth, rowHeight).fill(bg);

    x = 50;
    row.forEach((cell, colIdx) => {
      doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
        .text(String(cell ?? ''), x + 4, y + 7, { width: colWidths[colIdx] - 8 });
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
  const y = doc.page.height - 50;
  doc.rect(0, y - 10, doc.page.width, 60).fill(COLORS.lightGray);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.gray)
    .text('Orbelo Charter | Private Jet Booking Management', 50, y, { align: 'center', width: doc.page.width - 100 });
  doc.text(`Page ${page} of ${totalPages}`, 50, y + 12, { align: 'right', width: doc.page.width - 100 });
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
 * Generate a PDF Quotation
 */
const generateQuotationPDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, 'CHARTER QUOTATION');

  const bufferPromise = docToBuffer(doc);

  // Quote info block
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.gold)
    .text(`Quote Reference: ${booking.tripNumber}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
    .text(`Date: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' })
    .text(`Valid Until: ${booking.quoteExpirationDate || 'TBD'}`, { align: 'right' });
  doc.moveDown(1);

  // Client details
  drawSectionHeader(doc, 'CLIENT DETAILS');
  const c = booking.client || {};
  drawDetailRow(doc, 'Name', c.fullName);
  drawDetailRow(doc, 'Company', c.companyName);
  drawDetailRow(doc, 'Email', c.email);
  drawDetailRow(doc, 'Phone', c.phone);
  if (c.vatNumber) drawDetailRow(doc, 'VAT Number', c.vatNumber);

  // Flight details
  drawSectionHeader(doc, 'FLIGHT DETAILS');
  const legs = booking.legs || [];
  legs.forEach((leg, i) => {
    if (legs.length > 1) {
      doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.gold)
        .text(`Leg ${i + 1}:`);
      doc.moveDown(0.2);
    }
    drawDetailRow(doc, 'From', `${leg.from || ''} (${leg.fromIcao || ''})`);
    drawDetailRow(doc, 'To', `${leg.to || ''} (${leg.toIcao || ''})`);
    drawDetailRow(doc, 'Departure Date', leg.departureDate);
    if (leg.departureTime) drawDetailRow(doc, 'Departure Time', leg.departureTime);
    drawDetailRow(doc, 'Passengers', leg.paxCount);
    if (leg.distanceNm) drawDetailRow(doc, 'Distance', `${leg.distanceNm} nm`);
    if (leg.flightTimeMinutes) {
      const h = Math.floor(leg.flightTimeMinutes / 60);
      const m = leg.flightTimeMinutes % 60;
      drawDetailRow(doc, 'Est. Flight Time', `${h}h ${m}m`);
    }
    if (i < legs.length - 1) doc.moveDown(0.3);
  });

  // Aircraft
  if (booking.aircraft?.name) {
    drawSectionHeader(doc, 'AIRCRAFT');
    const a = booking.aircraft;
    drawDetailRow(doc, 'Aircraft', a.name);
    drawDetailRow(doc, 'Manufacturer', a.manufacturer);
    drawDetailRow(doc, 'Category', (a.category || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    if (a.registration) drawDetailRow(doc, 'Registration', a.registration);
    if (a.passengers) drawDetailRow(doc, 'Max Passengers', a.passengers);
    if (a.range) drawDetailRow(doc, 'Range', `${a.range} nm`);
  }

  // Pricing
  const p = booking.pricing || {};
  drawSectionHeader(doc, 'PRICING BREAKDOWN');
  const currency = p.currency || 'USD';
  const pricingRows = [
    ['Base Charter Cost', formatCurrency(p.baseCharterCost, currency)],
    ['Fuel Surcharge', formatCurrency(p.fuelSurcharge, currency)],
    ['Landing Fees', formatCurrency(p.landingFees, currency)],
    ['Handling Fees', formatCurrency(p.handlingFees, currency)],
  ];
  if (p.cateringCost > 0) pricingRows.push(['Catering', formatCurrency(p.cateringCost, currency)]);
  if (p.crewCost > 0) pricingRows.push(['Crew Expenses', formatCurrency(p.crewCost, currency)]);
  if (p.additionalServicesCost > 0) pricingRows.push(['Additional Services', formatCurrency(p.additionalServicesCost, currency)]);
  pricingRows.push(['Subtotal', formatCurrency(p.subtotal, currency)]);
  if (p.adminMargin > 0) pricingRows.push(['Management Fee', formatCurrency(p.adminMargin, currency)]);
  if (p.vatAmount > 0) pricingRows.push([`VAT (${p.vatRate}%)`, formatCurrency(p.vatAmount, currency)]);
  if (p.cardFee > 0) pricingRows.push(['Card Processing Fee (3.5%)', formatCurrency(p.cardFee, currency)]);

  drawTable(doc,
    [{ label: 'Item', width: 320 }, { label: 'Amount', width: 145 }],
    pricingRows
  );

  // Grand Total
  doc.moveDown(0.5);
  doc.rect(50, doc.y, doc.page.width - 100, 36).fill(COLORS.primary);
  doc.font(FONTS.bold).fontSize(12).fillColor(COLORS.gold)
    .text(`TOTAL: ${formatCurrency(p.grandTotal, currency)}`, 58, doc.y - 28, { align: 'right', width: doc.page.width - 108 });
  doc.moveDown(2);

  // Terms
  drawSectionHeader(doc, 'TERMS & CONDITIONS');
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.gray)
    .text('1. This quotation is valid for 48 hours from the date of issue.', 50)
    .text('2. All prices are subject to change based on fuel prices and regulatory fees at the time of booking.')
    .text('3. Payment terms: 50% deposit required upon booking confirmation, balance due 7 days before departure.')
    .text('4. Cancellation policy: Cancellations within 48 hours of departure are non-refundable.')
    .text('5. All flights are subject to aircraft availability and regulatory approvals.');

  drawFooter(doc, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate Invoice PDF
 */
const generateInvoicePDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, 'INVOICE');
  const bufferPromise = docToBuffer(doc);

  const invoiceNum = booking.invoiceNumber || booking.tripNumber;
  doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.gold)
    .text(`Invoice #: ${invoiceNum}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
    .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' })
    .text(`Trip Reference: ${booking.tripNumber}`, { align: 'right' })
    .text(`Payment Due: ${booking.paymentDueDate || 'Upon receipt'}`, { align: 'right' });
  doc.moveDown(1);

  // Bill To
  drawSectionHeader(doc, 'BILL TO');
  const c = booking.client || {};
  drawDetailRow(doc, 'Name', c.fullName, { bold: true });
  if (c.companyName) drawDetailRow(doc, 'Company', c.companyName);
  if (c.address) drawDetailRow(doc, 'Address', c.address);
  if (c.email) drawDetailRow(doc, 'Email', c.email);
  if (c.vatNumber) drawDetailRow(doc, 'VAT Number', c.vatNumber);
  if (c.accountNumber) drawDetailRow(doc, 'Account Number', c.accountNumber);

  // Service details
  drawSectionHeader(doc, 'SERVICE DETAILS');
  const legs = booking.legs || [];
  legs.forEach((leg, i) => {
    const prefix = legs.length > 1 ? `Leg ${i + 1}: ` : '';
    drawDetailRow(doc, `${prefix}Route`, `${leg.fromIcao || ''} → ${leg.toIcao || ''}`);
    drawDetailRow(doc, `${prefix}Date`, leg.departureDate);
  });
  if (booking.aircraft?.name) drawDetailRow(doc, 'Aircraft', `${booking.aircraft.name} ${booking.aircraft.registration ? '(' + booking.aircraft.registration + ')' : ''}`);

  // Invoice line items
  const p = booking.pricing || {};
  const currency = p.currency || 'USD';
  drawSectionHeader(doc, 'INVOICE LINE ITEMS');
  const lineItems = [
    ['Charter Services', formatCurrency(p.baseCharterCost, currency)],
    ['Fuel Surcharge', formatCurrency(p.fuelSurcharge, currency)],
    ['Airport Fees (Landing + Handling)', formatCurrency((p.landingFees || 0) + (p.handlingFees || 0), currency)],
  ];
  if (p.cateringCost > 0) lineItems.push(['In-Flight Catering', formatCurrency(p.cateringCost, currency)]);
  if (p.additionalServicesCost > 0) lineItems.push(['Additional Services', formatCurrency(p.additionalServicesCost, currency)]);
  if (p.adminMargin > 0) lineItems.push(['Management Fee', formatCurrency(p.adminMargin, currency)]);
  if (p.agentMargin > 0) lineItems.push(['Agency Fee', formatCurrency(p.agentMargin, currency)]);

  drawTable(doc,
    [{ label: 'Description', width: 320 }, { label: 'Amount', width: 145 }],
    lineItems
  );

  // Totals
  doc.moveDown(0.5);
  if (p.vatAmount > 0) {
    doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
      .text(`Subtotal: ${formatCurrency(p.totalBeforeTax, currency)}`, { align: 'right' })
      .text(`VAT (${p.vatRate}%): ${formatCurrency(p.vatAmount, currency)}`, { align: 'right' });
  }
  if (p.cardFee > 0) {
    doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
      .text(`Card Processing Fee: ${formatCurrency(p.cardFee, currency)}`, { align: 'right' });
  }
  doc.rect(50, doc.y, doc.page.width - 100, 36).fill(COLORS.primary);
  doc.font(FONTS.bold).fontSize(12).fillColor(COLORS.gold)
    .text(`TOTAL DUE: ${formatCurrency(p.grandTotal, currency)}`, 58, doc.y - 28, { align: 'right', width: doc.page.width - 108 });
  doc.moveDown(2);

  // Bank details
  drawSectionHeader(doc, 'PAYMENT DETAILS');
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.dark)
    .text('Bank: Orbelo Charter Bank', 50)
    .text('Account Name: Orbelo Charter Ltd')
    .text('IBAN: GB00 ORBE 0000 0000 0000 00')
    .text('SWIFT/BIC: ORBEGB2X')
    .text('Reference: Please quote your trip reference number when making payment.');

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

  doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.gold)
    .text(`Trip Reference: ${booking.tripNumber}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
    .text(`Prepared: ${new Date().toLocaleString('en-GB')}`, { align: 'right' });
  doc.moveDown(1);

  // Flight information
  drawSectionHeader(doc, 'FLIGHT INFORMATION');
  const legs = booking.legs || [];
  legs.forEach((leg, i) => {
    if (legs.length > 1) {
      doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.gold).text(`LEG ${i + 1}`);
      doc.moveDown(0.2);
    }
    drawDetailRow(doc, 'Origin', `${leg.from || ''} (${leg.fromIcao || ''})`);
    drawDetailRow(doc, 'Destination', `${leg.to || ''} (${leg.toIcao || ''})`);
    drawDetailRow(doc, 'Departure Date', leg.departureDate);
    drawDetailRow(doc, 'Departure Time', leg.departureTime || 'TBC');
    drawDetailRow(doc, 'Passengers', leg.paxCount);
    if (leg.distanceNm) drawDetailRow(doc, 'Distance', `${leg.distanceNm} nm`);
    if (leg.flightTimeMinutes) {
      const h = Math.floor(leg.flightTimeMinutes / 60);
      const m = leg.flightTimeMinutes % 60;
      drawDetailRow(doc, 'Est. Flight Time', `${h}h ${m}m`);
    }
    if (i < legs.length - 1) doc.moveDown(0.5);
  });

  // Aircraft & Operator
  drawSectionHeader(doc, 'AIRCRAFT & OPERATOR');
  const a = booking.aircraft || {};
  const o = booking.operator || {};
  drawDetailRow(doc, 'Aircraft', a.name);
  drawDetailRow(doc, 'Registration', a.registration);
  drawDetailRow(doc, 'Category', a.category);
  drawDetailRow(doc, 'Max Passengers', a.passengers);
  if (o.legalName) drawDetailRow(doc, 'Operator', o.legalName);
  if (o.opsPhone) drawDetailRow(doc, 'Ops Phone', o.opsPhone);
  if (o.opsEmail) drawDetailRow(doc, 'Ops Email', o.opsEmail);

  // Passenger manifest summary
  drawSectionHeader(doc, 'PASSENGER DETAILS');
  const c = booking.client || {};
  drawDetailRow(doc, 'Lead Passenger', c.fullName);
  drawDetailRow(doc, 'Contact', c.email);
  drawDetailRow(doc, 'Phone', c.phone);

  // Additional services
  const svc = booking.services || {};
  const activeServices = [];
  if (svc.catering) activeServices.push(`In-flight catering: ${svc.cateringDetails || 'Standard'}`);
  if (svc.groundTransport) activeServices.push(`Ground transport: ${svc.groundTransportDetails || 'Required'}`);
  if (svc.flightAttendant) activeServices.push('Flight attendant');
  if (svc.wifiOnboard) activeServices.push('Wi-Fi onboard');
  if (svc.customSecurity) activeServices.push('Custom security');
  if (activeServices.length > 0) {
    drawSectionHeader(doc, 'SPECIAL SERVICES');
    activeServices.forEach((s) => {
      doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.dark).text(`• ${s}`, 58);
    });
  }

  // Notes
  if (booking.notes) {
    drawSectionHeader(doc, 'NOTES');
    doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.dark).text(booking.notes, 58);
  }

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
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.dark)
    .text(`Agreement Date: ${booking.contractDate || today}`)
    .text(`Reference: ${booking.tripNumber}`);
  doc.moveDown(1);

  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.dark)
    .text('This Charter Agreement ("Agreement") is entered into between Orbelo Charter Ltd ("Operator") and the undersigned charterer ("Charterer").');
  doc.moveDown(0.5);

  // Parties
  drawSectionHeader(doc, 'PARTIES');
  const c = booking.client || {};
  drawDetailRow(doc, 'Charterer', c.fullName);
  if (c.companyName) drawDetailRow(doc, 'Company', c.companyName);
  drawDetailRow(doc, 'Email', c.email);
  drawDetailRow(doc, 'Charter Company', 'Orbelo Charter Ltd');

  // Flight details
  drawSectionHeader(doc, 'CHARTER DETAILS');
  (booking.legs || []).forEach((leg, i) => {
    const prefix = booking.legs.length > 1 ? `Leg ${i + 1}: ` : '';
    drawDetailRow(doc, `${prefix}Route`, `${leg.fromIcao || ''} → ${leg.toIcao || ''}`);
    drawDetailRow(doc, `${prefix}Date`, leg.departureDate);
    drawDetailRow(doc, `${prefix}Passengers`, leg.paxCount);
  });
  drawDetailRow(doc, 'Aircraft', `${booking.aircraft?.name || 'TBC'}${booking.aircraft?.registration ? ' (' + booking.aircraft.registration + ')' : ''}`);

  // Pricing
  const p = booking.pricing || {};
  drawDetailRow(doc, 'Charter Price', formatCurrency(p.grandTotal, p.currency));
  drawDetailRow(doc, 'Payment Terms', 'As per invoice');

  // Terms
  drawSectionHeader(doc, 'TERMS AND CONDITIONS');
  const terms = [
    '1. CHARTER PRICE: The charter price includes all costs as detailed in the attached quotation. Any additional costs incurred during the charter will be billed separately.',
    '2. PAYMENT: 50% deposit is required upon signing this agreement. The remaining balance is due 7 days before the scheduled departure.',
    '3. CANCELLATION: Cancellations must be made in writing. Cancellations within 72 hours of departure will incur a 100% cancellation fee. Prior to 72 hours, fees apply per the schedule provided.',
    '4. BAGGAGE: Baggage allowance is subject to aircraft weight limitations. The Operator reserves the right to limit baggage if necessary for safety reasons.',
    '5. FORCE MAJEURE: Neither party shall be liable for failure to perform obligations due to circumstances beyond their reasonable control, including but not limited to weather, ATC restrictions, or government actions.',
    '6. GOVERNING LAW: This Agreement shall be governed by and construed in accordance with applicable laws.',
    '7. ENTIRE AGREEMENT: This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations and representations.',
  ];

  terms.forEach((term) => {
    doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(term, 50);
    doc.moveDown(0.3);
  });

  // Signatures
  doc.addPage();
  drawHeader(doc, 'SIGNATURES');

  doc.moveDown(2);
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.dark).text('CHARTERER SIGNATURE', 50);
  doc.moveDown(0.5);
  doc.rect(50, doc.y, 200, 50).stroke(COLORS.border);
  doc.moveDown(3.5);
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
    .text(`Name: ${c.fullName || '___________________'}`)
    .text(`Date: ___________________`);

  doc.moveDown(2);
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.dark).text('ORBELO CHARTER - AUTHORIZED SIGNATURE', 50);
  doc.moveDown(0.5);
  doc.rect(50, doc.y, 200, 50).stroke(COLORS.border);
  doc.moveDown(3.5);
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
    .text('Name: ___________________')
    .text('Title: ___________________')
    .text('Date: ___________________');

  drawFooter(doc, 2, 2);
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

  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.gold)
    .text(`Trip Reference: ${booking.tripNumber}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
    .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' });
  doc.moveDown(1);

  drawSectionHeader(doc, 'FLIGHT DETAILS');
  (booking.legs || []).forEach((leg, i) => {
    const prefix = booking.legs.length > 1 ? `Leg ${i + 1}: ` : '';
    drawDetailRow(doc, `${prefix}Route`, `${leg.fromIcao || ''} → ${leg.toIcao || ''}`);
    drawDetailRow(doc, `${prefix}Date`, leg.departureDate);
    drawDetailRow(doc, `${prefix}Pax`, leg.paxCount);
  });
  drawDetailRow(doc, 'Aircraft', booking.aircraft?.name);
  drawDetailRow(doc, 'Registration', booking.aircraft?.registration);

  drawSectionHeader(doc, 'PASSENGER LIST');
  drawTable(doc,
    [
      { label: '#', width: 30 },
      { label: 'Full Name', width: 160 },
      { label: 'Passport/ID', width: 100 },
      { label: 'Nationality', width: 100 },
      { label: 'DOB', width: 75 },
    ],
    Array.from({ length: booking.legs?.[0]?.paxCount || 1 }, (_, i) => [
      i + 1,
      i === 0 ? (booking.client?.fullName || '') : '',
      '',
      '',
      '',
    ])
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
  doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.gold)
    .text(`Credit Note #: ${creditNoteNum}`, { align: 'right' });
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.gray)
    .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' })
    .text(`Original Trip: ${booking.tripNumber}`, { align: 'right' });
  doc.moveDown(1);

  drawSectionHeader(doc, 'CREDIT TO');
  const c = booking.client || {};
  drawDetailRow(doc, 'Name', c.fullName, { bold: true });
  if (c.companyName) drawDetailRow(doc, 'Company', c.companyName);
  drawDetailRow(doc, 'Email', c.email);

  drawSectionHeader(doc, 'CREDIT DETAILS');
  const p = booking.pricing || {};
  drawDetailRow(doc, 'Original Invoice', booking.invoiceNumber || booking.tripNumber);
  drawDetailRow(doc, 'Reason', reason || 'Service cancellation/adjustment');
  doc.moveDown(1);
  doc.rect(50, doc.y, doc.page.width - 100, 36).fill(COLORS.primary);
  doc.font(FONTS.bold).fontSize(12).fillColor(COLORS.gold)
    .text(`CREDIT AMOUNT: ${formatCurrency(creditAmount, p.currency)}`, 58, doc.y - 28, { align: 'right', width: doc.page.width - 108 });
  doc.moveDown(2);

  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.dark)
    .text('This credit note will be applied to your account or refunded per your instructions. Please contact your Orbelo representative for processing.');

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

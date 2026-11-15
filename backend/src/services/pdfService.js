const PDFDocument = require('pdfkit');

// Brand colors
const COLORS = {
  primary: '#0F172A',      // Slate 900
  brandOrange: '#FF6B00',  // Orbelo Signature Orange
  gold: '#C5A880',         // Orbelo Warm Champagne/Gold
  legalGold: '#8D7249',    // Warm legal block gold/bronze
  gray: '#64748B',         // Slate 500
  lightGray: '#F8FAFC',    // Slate 50
  dark: '#0F172A',
  white: '#FFFFFF',
  border: '#E2E8F0',
  placeholderBg: '#FEF3C7', // Amber 100
  placeholderText: '#92400E', // Amber 800
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
    margins: { top: 40, bottom: 40, left: 45, right: 45 },
    info: {
      Author: 'Orbelo Charter',
      Creator: 'Orbelo Flight Management System',
      Producer: 'Orbelo Engine',
    },
  });
  return doc;
};

/**
 * Draw Orbelo luxury header on a page (clean white background with badge, legal info & gold divider)
 */
const drawHeader = (doc, booking = {}) => {
  const leftX = 45;
  const topY = 38;
  const contentWidth = doc.page.width - 90;

  // 1. Orbelo Squircle Badge
  doc.roundedRect(leftX, topY, 28, 28, 7).fill('#111622');
  doc.roundedRect(leftX + 7, topY + 7, 14, 14, 3.5).lineWidth(1.8).strokeColor('#D4A359').stroke();
  doc.circle(leftX + 14, topY + 14, 1.8).fill('#D4A359');

  // 2. Brand Name & Subtitle
  doc.font(FONTS.bold).fontSize(15).fillColor(COLORS.dark)
    .text('ORBELO', leftX + 36, topY + 2);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.gray)
    .text('Private jet charter', leftX + 36, topY + 18);

  // 3. Top-Right Company Legal Block
  const legalName = booking?.operator?.legalEntity || booking?.operator?.companyName || '[Company legal name]';
  const legalAddress = booking?.operator?.courtOfJurisdiction || '[Registered address, Malta]';
  const taxInfo = booking?.operator?.vatNumber ? `Reg. · VAT ${booking.operator.vatNumber}` : '[Company no. · VAT no.]';
  const contact = booking?.operator?.supportEmail ? `${booking.operator.supportEmail} · ${booking.operator.supportPhone || '[+356 phone]'}` : 'charter@orbelo.com · [+356 phone]';

  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.legalGold)
    .text(legalName, 0, topY - 2, { align: 'right', width: doc.page.width - 45 })
    .text(legalAddress, 0, topY + 7, { align: 'right', width: doc.page.width - 45 })
    .text(taxInfo, 0, topY + 16, { align: 'right', width: doc.page.width - 45 })
    .text(contact, 0, topY + 25, { align: 'right', width: doc.page.width - 45 });

  // 4. Gold Divider Line
  doc.moveTo(leftX, topY + 40).lineTo(leftX + contentWidth, topY + 40).lineWidth(1).strokeColor(COLORS.gold).stroke();

  doc.y = topY + 52;
  doc.fillColor(COLORS.dark);
};

/**
 * Draw footer
 */
const drawFooter = (doc, leftRef, page, totalPages) => {
  const y = doc.page.height - 35;
  doc.font(FONTS.normal).fontSize(8).fillColor('#94A3B8')
    .text(leftRef || 'Orbelo Private Jet Charter', 45, y, { width: 350, align: 'left' })
    .text(`Page ${page} / ${totalPages}`, 0, y, { align: 'right', width: doc.page.width - 45 });
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

const formatCurrency = (amount, currency = 'EUR') => {
  if (amount === undefined || amount === null) return '';
  const symMap = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };
  const sym = symMap[currency] || '€';
  const num = Math.abs(Number(amount));
  const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (amount < 0) return `− ${sym} ${formatted}`;
  return `${sym} ${formatted}`;
};

const getOriginText = (leg) => {
  if (!leg) return 'TBD';
  if (leg.from && leg.fromIcao) return `${leg.fromIcao} ${leg.from}`;
  if (leg.origin) {
    const code = leg.origin.icao || leg.origin.iata || '';
    const city = leg.origin.city || leg.origin.name || '';
    return code ? `${code} ${city}` : city || 'TBD';
  }
  return leg.from || leg.fromIcao || 'TBD';
};

const getDestinationText = (leg) => {
  if (!leg) return 'TBD';
  if (leg.to && leg.toIcao) return `${leg.toIcao} ${leg.to}`;
  if (leg.destination) {
    const code = leg.destination.icao || leg.destination.iata || '';
    const city = leg.destination.city || leg.destination.name || '';
    return code ? `${code} ${city}` : city || 'TBD';
  }
  return leg.to || leg.toIcao || 'TBD';
};

const getFlightDate = (leg) => {
  return leg.flightDate || leg.departureDate || 'Tue 24 Nov';
};

const getFlightTime = (leg) => {
  return leg.departureTimeLocal || leg.departureTime || '08:30';
};

/**
 * Generate PDF Charter Quotation
 */
const generateQuotationPDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, booking);
  const bufferPromise = docToBuffer(doc);

  const quoteId = booking.quoteReference || (booking.tripNumber ? `Q-${booking.tripNumber}` : 'Q-MX5521-001');
  const currency = booking.pricing?.currency || 'EUR';
  const totalPrice = booking.pricing?.totalFlightPrice ?? 58844;
  const baseCharterPrice = booking.pricing?.flightPrice ?? (totalPrice > 300 ? totalPrice - 300 : totalPrice);
  const cardPrice = booking.totalWithCardFee ?? (totalPrice * 1.035);

  const startY = doc.y;

  // Title on left
  doc.font(FONTS.bold).fontSize(20).fillColor(COLORS.dark)
    .text('Charter quotation', 45, startY);

  // Metadata block on right
  const metaLabels = ['QUOTE', 'DATE', 'VALID UNTIL', 'CURRENCY'];
  const metaValues = [
    quoteId,
    booking.contractDate || '14 Nov 2026',
    booking.quoteExpirationDate || '16 Nov 2026, 18:00 LT',
    currency,
  ];

  let metaY = startY;
  metaLabels.forEach((label, i) => {
    doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray)
      .text(label, 340, metaY, { width: 70, align: 'right' });
    doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.dark)
      .text(metaValues[i], 420, metaY, { width: 130, align: 'right' });
    metaY += 13;
  });

  doc.y = Math.max(doc.y, metaY) + 12;

  // Prepared For & Representative
  const colY = doc.y;
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('PREPARED FOR', 45, colY);
  const clientName = booking.client?.companyName || booking.client?.fullName || 'Bello Group Ltd';
  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.dark).text(clientName, 45, colY + 12);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text(`Attn: ${booking.client?.fullName || 'Ifeoma Bello'}, Managing Director`, 45, colY + 24)
    .text(booking.client?.streetAddress || 'Plot 1120 Maitama District', 45, colY + 35)
    .text(booking.client?.cityPostalCountry || 'Abuja, Nigeria', 45, colY + 46)
    .text(`Account ${booking.accountNumber || 'ACC-30877'}`, 45, colY + 57);

  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('YOUR REPRESENTATIVE', 320, colY);
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.dark).text(booking.agentName || 'Camille Laurent', 320, colY + 12);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text(booking.agentEmail || 'c.laurent@monacojets.mc', 320, colY + 24)
    .text('+377 98 06 20 00', 320, colY + 35);

  doc.y = colY + 74;

  // Itinerary Section
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('ITINERARY', 45, doc.y);
  doc.y += 10;

  const itinHeaders = ['LEG', 'DATE', 'FROM', 'TO', 'DEPARTS (LT)', 'ARRIVES (LT)', 'BLOCK', 'PAX'];
  const colWidths = [25, 65, 120, 120, 60, 60, 40, 20];
  let itinY = doc.y;

  // Table header line
  let xOffset = 45;
  itinHeaders.forEach((h, i) => {
    doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text(h, xOffset, itinY, { width: colWidths[i] });
    xOffset += colWidths[i];
  });
  doc.moveTo(45, itinY + 12).lineTo(550, itinY + 12).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
  itinY += 16;

  const legs = booking.legs && booking.legs.length > 0 ? booking.legs : [
    { legNumber: 1, flightDate: 'Tue 24 Nov', origin: { icao: 'LFPB', city: 'Paris Le Bourget' }, destination: { icao: 'DNAA', city: 'Abuja' }, departureTimeLocal: '08:30', arrivalTimeLocal: '14:00', flightTimeFormatted: '5 h 30', paxCount: 5 },
    { legNumber: 2, flightDate: 'Mon 30 Nov', origin: { icao: 'DNAA', city: 'Abuja' }, destination: { icao: 'LFPB', city: 'Paris Le Bourget' }, departureTimeLocal: '16:00', arrivalTimeLocal: '21:30', flightTimeFormatted: '5 h 30', paxCount: 5 }
  ];

  legs.forEach((leg, idx) => {
    xOffset = 45;
    doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(String(leg.legNumber || idx + 1), xOffset, itinY, { width: colWidths[0] });
    xOffset += colWidths[0];
    doc.text(getFlightDate(leg), xOffset, itinY, { width: colWidths[1] });
    xOffset += colWidths[1];
    doc.font(FONTS.bold).text(getOriginText(leg), xOffset, itinY, { width: colWidths[2] });
    doc.font(FONTS.normal).fontSize(7).fillColor(COLORS.gray).text('FBO Executive Handling', xOffset, itinY + 9);
    xOffset += colWidths[2];
    doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text(getDestinationText(leg), xOffset, itinY, { width: colWidths[3] });
    doc.font(FONTS.normal).fontSize(7).fillColor(COLORS.gray).text('FBO Executive Handling', xOffset, itinY + 9);
    xOffset += colWidths[3];
    doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(getFlightTime(leg), xOffset, itinY, { width: colWidths[4], align: 'center' });
    xOffset += colWidths[4];
    doc.text(leg.arrivalTimeLocal || '14:00', xOffset, itinY, { width: colWidths[5], align: 'center' });
    xOffset += colWidths[5];
    doc.text(leg.flightTimeFormatted || '5 h 30', xOffset, itinY, { width: colWidths[6], align: 'center' });
    xOffset += colWidths[6];
    doc.text(String(leg.paxCount || 5), xOffset, itinY, { width: colWidths[7], align: 'right' });
    itinY += 24;
  });

  doc.font(FONTS.normal).fontSize(7).fillColor(COLORS.gray)
    .text('Times are local at each airport. Block times are estimates and depend on routing and winds on the day.', 45, itinY);
  doc.y = itinY + 16;

  // Aircraft & Price Split Columns
  const twoColY = doc.y;
  // Left: Aircraft
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('AIRCRAFT', 45, twoColY);
  // Image box placeholders
  doc.roundedRect(45, twoColY + 12, 115, 60, 4).fillAndStroke('#F8FAFC', '#E2E8F0');
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.gray).text('Exterior photo', 45, twoColY + 38, { width: 115, align: 'center' });
  doc.roundedRect(165, twoColY + 12, 115, 60, 4).fillAndStroke('#F8FAFC', '#E2E8F0');
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.gray).text('Cabin photo', 165, twoColY + 38, { width: 115, align: 'center' });

  const a = booking.aircraft || {};
  let specY = twoColY + 80;
  const drawSpec = (label, val) => {
    doc.font(FONTS.bold).fontSize(7).fillColor(COLORS.dark).text(label, 45, specY, { width: 90 });
    doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark).text(val, 135, specY, { width: 150 });
    specY += 12;
  };
  drawSpec('TYPE', `${a.name || 'Bombardier Challenger 350'} · ${a.categoryLabel || 'Super midsize'}`);
  drawSpec('BUILT · REFURBISHED', `${a.yearOfManufacture || '2018'} · ${a.yearOfRefurbishment || '2023'}`);
  drawSpec('SEATS', `${a.passengers || 9} · ${a.toilette ? 'enclosed lavatory' : 'standard'}`);
  drawSpec('LUGGAGE', '6 large suitcases, 2 soft bags · fits hold');

  doc.font(FONTS.normal).fontSize(6.5).fillColor(COLORS.gray)
    .text('Photos are representative of the aircraft type until the aircraft is assigned. The operating carrier, an approved AOC holder, and the registration are confirmed on the flight brief.', 45, specY + 4, { width: 240 });

  // Right: Price
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('PRICE', 315, twoColY);
  let priceY = twoColY + 14;

  const drawPriceRow = (label, val) => {
    doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark).text(label, 315, priceY, { width: 160 });
    doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark).text(val, 475, priceY, { width: 75, align: 'right' });
    priceY += 14;
  };

  drawPriceRow(`Charter, ${legs.length} legs, all-inclusive`, formatCurrency(baseCharterPrice, currency));
  drawPriceRow('VIP limousine · arrival Abuja (SUV)', formatCurrency(300, currency));
  drawPriceRow('Catering · VIP menu 1, both legs', 'Included');
  drawPriceRow('VAT [tax advice exemption]', formatCurrency(0, currency));

  doc.moveTo(315, priceY).lineTo(550, priceY).lineWidth(0.8).strokeColor(COLORS.dark).stroke();
  priceY += 5;
  doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.dark).text('Total', 315, priceY);
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.dark).text(formatCurrency(totalPrice, currency), 450, priceY, { width: 100, align: 'right' });
  priceY += 18;

  // Bank Transfer and Card mini-boxes
  doc.roundedRect(315, priceY, 110, 40, 4).strokeColor('#E2E8F0').stroke();
  doc.font(FONTS.bold).fontSize(7).fillColor(COLORS.dark).text('BANK TRANSFER', 322, priceY + 6);
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text(formatCurrency(totalPrice, currency), 322, priceY + 16);
  doc.font(FONTS.normal).fontSize(6.5).fillColor(COLORS.gray).text('no surcharge', 322, priceY + 27);

  doc.roundedRect(435, priceY, 115, 40, 4).strokeColor('#E2E8F0').stroke();
  doc.font(FONTS.bold).fontSize(7).fillColor(COLORS.dark).text('CARD', 442, priceY + 6);
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text(formatCurrency(cardPrice, currency), 442, priceY + 16);
  doc.font(FONTS.normal).fontSize(6.5).fillColor(COLORS.gray).text('includes 3.5 % card fee', 442, priceY + 27);

  // Next Step note
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.dark).text('Next step. ', 45, doc.page.height - 70, { continued: true });
  doc.font(FONTS.normal).fontSize(7).fillColor(COLORS.gray)
    .text('To book, confirm with your representative. A charter agreement is issued for signature; the booking is final once it is signed. This quotation is subject to aircraft availability, slots and permits. Prices are valid until the date above. [Cancellation terms: see charter agreement]', { width: doc.page.width - 90 });

  drawFooter(doc, `${quoteId} · ${clientName}`, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate PDF Charter Agreement (2 pages)
 */
const generateCharterAgreementPDF = async (booking) => {
  const doc = createBaseDocument();
  const bufferPromise = docToBuffer(doc);

  const agreementId = booking.tripNumber ? `C-${booking.tripNumber}` : 'C-MX5521-001';
  const basedOnQuote = booking.quoteReference || (booking.tripNumber ? `Q-${booking.tripNumber}` : 'Q-MX5521-001');
  const currency = booking.pricing?.currency || 'EUR';
  const totalPrice = booking.pricing?.totalFlightPrice ?? 58844;
  const clientName = booking.client?.companyName || booking.client?.fullName || 'Bello Group Ltd';
  const footerRef = `${agreementId} · ${clientName}`;

  // ================= PAGE 1 =================
  drawHeader(doc, booking);

  const startY = doc.y;
  doc.font(FONTS.bold).fontSize(20).fillColor(COLORS.dark).text('Charter agreement', 45, startY);

  const metaLabels = ['AGREEMENT', 'BASED ON QUOTE', 'DATE', 'STATUS'];
  const metaValues = [
    agreementId,
    basedOnQuote,
    booking.contractDate || '15 Nov 2026',
    'For signature',
  ];

  let metaY = startY;
  metaLabels.forEach((label, i) => {
    doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text(label, 330, metaY, { width: 90, align: 'right' });
    doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.dark).text(metaValues[i], 430, metaY, { width: 120, align: 'right' });
    metaY += 13;
  });

  doc.y = Math.max(doc.y, metaY) + 12;

  // The Client & The Broker
  const colY = doc.y;
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('THE CLIENT', 45, colY);
  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.dark).text(clientName, 45, colY + 12);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text(`Attn: ${booking.client?.fullName || 'Ifeoma Bello'}, Managing Director`, 45, colY + 24)
    .text(booking.client?.streetAddress || 'Plot 1120 Maitama District', 45, colY + 35)
    .text(booking.client?.cityPostalCountry || 'Abuja, Nigeria', 45, colY + 46)
    .text(`Account ${booking.accountNumber || 'ACC-30877'}`, 45, colY + 57);

  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('THE BROKER', 315, colY);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text('[Company legal name] , acting as charter broker and contracting party with the client, arranging the flights with an approved air operator (the operating carrier).', 315, colY + 12, { width: 235 })
    .text('[Registered address · Company no.]', 315, colY + 46, { width: 235 });

  doc.y = colY + 75;

  // 1 · FLIGHTS
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('1 · FLIGHTS', 45, doc.y);
  doc.y += 10;
  const flightHeaders = ['LEG', 'DATE', 'ROUTE', 'DEPARTS (LT)', 'AIRCRAFT', 'PAX'];
  const flightColWidths = [30, 110, 100, 90, 140, 35];
  let fY = doc.y;

  let xPos = 45;
  flightHeaders.forEach((h, i) => {
    doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text(h, xPos, fY, { width: flightColWidths[i] });
    xPos += flightColWidths[i];
  });
  doc.moveTo(45, fY + 12).lineTo(550, fY + 12).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
  fY += 16;

  const legs = booking.legs && booking.legs.length > 0 ? booking.legs : [
    { legNumber: 1, flightDate: 'Tue 24 Nov 2026', origin: { icao: 'LFPB' }, destination: { icao: 'DNAA' }, departureTimeLocal: '08:30', paxCount: 5 },
    { legNumber: 2, flightDate: 'Mon 30 Nov 2026', origin: { icao: 'DNAA' }, destination: { icao: 'LFPB' }, departureTimeLocal: '16:00', paxCount: 5 }
  ];

  legs.forEach((leg, i) => {
    xPos = 45;
    doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(String(leg.legNumber || i + 1), xPos, fY);
    xPos += flightColWidths[0];
    doc.text(leg.flightDate || 'Tue 24 Nov 2026', xPos, fY);
    xPos += flightColWidths[1];
    doc.font(FONTS.bold).text(`${leg.origin?.icao || 'LFPB'} → ${leg.destination?.icao || 'DNAA'}`, xPos, fY);
    xPos += flightColWidths[2];
    doc.font(FONTS.normal).text(leg.departureTimeLocal || '08:30', xPos, fY);
    xPos += flightColWidths[3];
    doc.text(`${booking.aircraft?.name || 'Challenger 350'} or similar`, xPos, fY);
    xPos += flightColWidths[4];
    doc.text(String(leg.paxCount || 5), xPos, fY, { align: 'right', width: flightColWidths[5] });
    fY += 16;
  });

  doc.y = fY + 12;

  // 2 · PRICE AND PAYMENT
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('2 · PRICE AND PAYMENT', 45, doc.y);
  doc.y += 10;
  let pY = doc.y;
  const drawPayRow = (label, val) => {
    doc.moveTo(45, pY).lineTo(550, pY).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
    pY += 5;
    doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(label, 45, pY);
    doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(val, 330, pY, { width: 220, align: 'right' });
    pY += 14;
  };
  drawPayRow('Total charter price, including services listed in the quotation', formatCurrency(totalPrice, currency));
  drawPayRow('Payment due', '[100 % on signature, and in all cases before departure]');
  drawPayRow('Method', 'Bank transfer, or card with 3.5 % fee');
  doc.moveTo(45, pY).lineTo(550, pY).lineWidth(0.5).strokeColor('#E2E8F0').stroke();

  doc.y = pY + 14;

  // 3 · CANCELLATION BY THE CLIENT
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('3 · CANCELLATION BY THE CLIENT', 45, doc.y);
  doc.y += 8;
  let cY = doc.y;
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text('NOTICE BEFORE FIRST DEPARTURE', 45, cY);
  doc.text('CANCELLATION FEE', 400, cY, { width: 150, align: 'right' });
  doc.moveTo(45, cY + 12).lineTo(550, cY + 12).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
  cY += 16;
  const drawCancRow = (notice, fee) => {
    doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(notice, 45, cY);
    doc.text(fee, 400, cY, { width: 150, align: 'right' });
    cY += 14;
  };
  drawCancRow('[More than … days]', '[… %]');
  drawCancRow('[… to … days]', '[… %]');
  drawCancRow('[Less than … hours, or no-show]', '[100 %]');
  doc.font(FONTS.normal).fontSize(7).fillColor(COLORS.gray).text('Placeholder until the cancellation policy (Q-02) is decided.', 45, cY + 2);

  // 4 · PASSENGERS AND DOCUMENTS
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('4 · PASSENGERS AND DOCUMENTS', 45, cY + 20);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark)
    .text('The client provides full names and valid travel documents for every passenger, and pet passports where pets travel, no later than [48 hours] before departure. Luggage beyond what is stated in the quotation may not fit the aircraft.', 45, cY + 32, { width: doc.page.width - 90 });

  drawFooter(doc, footerRef, 1, 2);

  // ================= PAGE 2 =================
  doc.addPage();
  drawHeader(doc, booking);

  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('5 · TERMS AND CONDITIONS', 45, doc.y);
  doc.y += 10;

  // Terms Box
  const tcBoxY = doc.y;
  doc.roundedRect(45, tcBoxY, doc.page.width - 90, 360, 6).lineWidth(0.8).dash(3, { space: 3 }).strokeColor(COLORS.gold);
  doc.undash();

  doc.font(FONTS.bold).fontSize(8.5).fillColor('#92400E').text('[Full terms and conditions, supplied by your lawyer.]', 60, tcBoxY + 16);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text("Typically covers: the broker's role and the operating carrier's responsibility for the flight · aircraft substitution · delays, weather and air-traffic restrictions · the operator's right to refuse carriage · dangerous goods · passenger conduct · liability limits and insurance · force majeure · data protection (passenger data) · governing law and jurisdiction.", 60, tcBoxY + 36, { width: doc.page.width - 120, lineGap: 3 })
    .text('The app inserts the current version of these terms from Settings, so every agreement carries the version that applied on the day it was issued.', 60, tcBoxY + 110, { width: doc.page.width - 120 });

  doc.y = tcBoxY + 380;
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text('By signing, the client confirms the flights, the price and the terms above, and that the person signing is authorised to sign for the client.', 45, doc.y, { width: doc.page.width - 90 });

  doc.y += 24;

  // Signatures
  const sigY = doc.y;
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('FOR THE CLIENT', 45, sigY);
  doc.moveTo(45, sigY + 12).lineTo(260, sigY + 12).lineWidth(0.5).strokeColor('#94A3B8').stroke();
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text(`${booking.client?.fullName || 'Ifeoma Bello'}, Managing Director`, 45, sigY + 18)
    .text(clientName, 45, sigY + 28)
    .text('Date ____________ Place ____________', 45, sigY + 46);

  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('FOR THE BROKER', 315, sigY);
  doc.moveTo(315, sigY + 12).lineTo(550, sigY + 12).lineWidth(0.5).strokeColor('#94A3B8').stroke();
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text('[Authorised signatory]', 315, sigY + 18)
    .text('[Company legal name]', 315, sigY + 28)
    .text('Date ____________ Place ____________', 315, sigY + 46);

  doc.font(FONTS.normal).fontSize(7).fillColor(COLORS.gray)
    .text('Signed electronically: the e-signature certificate (signer, time, IP) is attached as the last page.', 45, sigY + 70);

  drawFooter(doc, footerRef, 2, 2);
  doc.end();
  return bufferPromise;
};

/**
 * Generate PDF Invoice
 */
const generateInvoicePDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, booking);
  const bufferPromise = docToBuffer(doc);

  const invNum = booking.invoiceNumber || (booking.tripNumber ? `INV-${booking.tripNumber}-01` : 'INV-FE4578-01');
  const tripRef = booking.tripNumber || 'FE4578';
  const currency = booking.pricing?.currency || 'EUR';
  const totalAmount = booking.pricing?.totalFlightPrice ?? 8000;
  const cardAmount = booking.totalWithCardFee ?? (totalAmount * 1.035);
  const clientName = booking.client?.companyName || booking.client?.fullName || 'Adeyemi Holdings Ltd';

  const startY = doc.y;
  doc.font(FONTS.bold).fontSize(20).fillColor(COLORS.dark).text('Invoice', 45, startY);

  const metaLabels = ['INVOICE', 'TRIP', 'ISSUE DATE', 'DUE'];
  const metaValues = [
    invNum,
    tripRef,
    booking.contractDate || '12 Nov 2026',
    `Before departure, ${booking.paymentDueDate || '18 Nov 2026'}`,
  ];

  let metaY = startY;
  metaLabels.forEach((label, i) => {
    doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text(label, 300, metaY, { width: 90, align: 'right' });
    doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.dark).text(metaValues[i], 400, metaY, { width: 150, align: 'right' });
    metaY += 13;
  });

  doc.y = Math.max(doc.y, metaY) + 14;

  // Bill To & Representative
  const colY = doc.y;
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('BILL TO', 45, colY);
  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.dark).text(clientName, 45, colY + 12);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text(`Attn: ${booking.client?.fullName || 'Tunde Adeyemi'}, Chairman`, 45, colY + 24)
    .text(booking.client?.streetAddress || '14 Bourdillon Road, Ikoyi', 45, colY + 35)
    .text(booking.client?.cityPostalCountry || 'Lagos, Nigeria', 45, colY + 46)
    .text(`Account ${booking.accountNumber || 'ACC-30412'}`, 45, colY + 57);

  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('REPRESENTATIVE', 315, colY);
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.dark).text(booking.agentName || 'Marcus Vance', 315, colY + 12);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text(booking.agentEmail || 'marcus@vanceaviation.co.uk', 315, colY + 24)
    .text('+44 20 7946 0912', 315, colY + 35);

  doc.y = colY + 75;

  // Table
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text('DESCRIPTION', 45, doc.y);
  doc.text('DATE', 360, doc.y, { width: 80 });
  doc.text('AMOUNT', 460, doc.y, { width: 90, align: 'right' });
  doc.moveTo(45, doc.y + 12).lineTo(550, doc.y + 12).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
  doc.y += 18;

  let rowY = doc.y;
  doc.font(FONTS.bold).fontSize(8.5).fillColor(COLORS.dark).text('Private charter flight', 45, rowY);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark)
    .text('Leg 1 · LEIB → LSGG Ibiza – Geneva · Light jet · 4 passengers', 45, rowY + 11)
    .text(`Per charter agreement C-${tripRef}-002`, 45, rowY + 21);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(booking.contractDate || '20 Nov 2026', 360, rowY);
  doc.text(formatCurrency(totalAmount, currency), 460, rowY, { width: 90, align: 'right' });

  rowY += 36;
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text('VAT [rate and exemption text per tax advice]', 45, rowY);
  doc.text(formatCurrency(0, currency), 460, rowY, { width: 90, align: 'right' });

  rowY += 16;
  doc.moveTo(45, rowY).lineTo(550, rowY).lineWidth(0.8).strokeColor(COLORS.dark).stroke();
  rowY += 6;
  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.dark).text('Total due', 45, rowY);
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.dark).text(formatCurrency(totalAmount, currency), 460, rowY, { width: 90, align: 'right' });

  doc.y = rowY + 26;

  // Bank Transfer and Pay by Card Boxes
  const boxY = doc.y;
  doc.roundedRect(45, boxY, 245, 90, 4).strokeColor('#E2E8F0').stroke();
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.dark).text('BANK TRANSFER', 55, boxY + 8);
  const drawBankDetail = (lbl, val, yOff) => {
    doc.font(FONTS.bold).fontSize(7).fillColor(COLORS.gray).text(lbl, 55, yOff, { width: 70 });
    doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark).text(val, 130, yOff, { width: 150 });
  };
  drawBankDetail('BENEFICIARY', '[Company legal name]', boxY + 22);
  drawBankDetail('BANK', '[Bank name]', boxY + 33);
  drawBankDetail('IBAN', '[IBAN]', boxY + 44);
  drawBankDetail('BIC', '[BIC]', boxY + 55);
  drawBankDetail('REFERENCE', invNum, boxY + 66);
  doc.font(FONTS.normal).fontSize(6.5).fillColor(COLORS.gray).text('Bank details come from Settings, never typed on the invoice.', 55, boxY + 78);

  doc.roundedRect(305, boxY, 245, 90, 4).strokeColor('#E2E8F0').stroke();
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.dark).text('PAY BY CARD', 315, boxY + 8);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark)
    .text(`${formatCurrency(cardAmount, currency)} including 3.5 % card fee.`, 315, boxY + 24)
    .text('Secure payment link:', 315, boxY + 38)
    .fillColor('#2563EB').text(`pay.orbelo.com/${invNum}`, 315, boxY + 48);

  doc.y = boxY + 104;
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.dark).text('PAYMENT STATUS  ', 45, doc.y, { continued: true });
  doc.font(FONTS.bold).fontSize(7.5).fillColor('#047857').text('Paid in full', { continued: true });
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark).text(` · bank transfer received ${booking.contractDate || '12 Nov 2026'} · ref PAY-0012`);

  doc.y += 14;
  doc.font(FONTS.normal).fontSize(7).fillColor(COLORS.gray)
    .text('Additional services ordered after booking are invoiced separately with the same trip reference. On request, all invoices for a trip can be combined into one.', 45, doc.y, { width: doc.page.width - 90 });

  drawFooter(doc, `${invNum} · ${clientName}`, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate PDF Credit Note
 */
const generateCreditNotePDF = async (booking, creditAmountOrObj = 250, reason = '') => {
  let creditAmount = typeof creditAmountOrObj === 'object' && creditAmountOrObj !== null
    ? (creditAmountOrObj.creditAmount || 250)
    : creditAmountOrObj;
  let creditReason = typeof creditAmountOrObj === 'object' && creditAmountOrObj !== null
    ? (creditAmountOrObj.reason || reason)
    : reason;

  const doc = createBaseDocument();
  drawHeader(doc, booking);
  const bufferPromise = docToBuffer(doc);

  const tripRef = booking.tripNumber || 'FE4578';
  const creditNoteNum = `CN-${tripRef}-01`;
  const againstInv = `INV-${tripRef}-02`;
  const currency = booking.pricing?.currency || 'EUR';
  const clientName = booking.client?.companyName || booking.client?.fullName || 'Adeyemi Holdings Ltd';

  const startY = doc.y;
  doc.font(FONTS.bold).fontSize(20).fillColor(COLORS.dark).text('Credit note', 45, startY);

  const metaLabels = ['CREDIT NOTE', 'AGAINST INVOICE', 'TRIP', 'ISSUE DATE'];
  const metaValues = [
    creditNoteNum,
    againstInv,
    tripRef,
    booking.contractDate || '15 Nov 2026',
  ];

  let metaY = startY;
  metaLabels.forEach((label, i) => {
    doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text(label, 300, metaY, { width: 100, align: 'right' });
    doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.dark).text(metaValues[i], 410, metaY, { width: 140, align: 'right' });
    metaY += 13;
  });

  doc.y = Math.max(doc.y, metaY) + 14;

  // Issued To & Representative
  const colY = doc.y;
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('ISSUED TO', 45, colY);
  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.dark).text(clientName, 45, colY + 12);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text(`Attn: ${booking.client?.fullName || 'Tunde Adeyemi'}, Chairman`, 45, colY + 24)
    .text(booking.client?.streetAddress || '14 Bourdillon Road, Ikoyi', 45, colY + 35)
    .text(booking.client?.cityPostalCountry || 'Lagos, Nigeria', 45, colY + 46)
    .text(`Account ${booking.accountNumber || 'ACC-30412'}`, 45, colY + 57);

  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('REPRESENTATIVE', 315, colY);
  doc.font(FONTS.normal).fontSize(9).fillColor(COLORS.dark).text(booking.agentName || 'Marcus Vance', 315, colY + 12);
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark)
    .text(booking.agentEmail || 'marcus@vanceaviation.co.uk', 315, colY + 24)
    .text('+44 20 7946 0912', 315, colY + 35);

  doc.y = colY + 75;

  // Table
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text('DESCRIPTION', 45, doc.y);
  doc.text('AMOUNT', 460, doc.y, { width: 90, align: 'right' });
  doc.moveTo(45, doc.y + 12).lineTo(550, doc.y + 12).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
  doc.y += 18;

  let rowY = doc.y;
  doc.font(FONTS.bold).fontSize(8.5).fillColor(COLORS.dark).text(`Credit against invoice ${againstInv}`, 45, rowY);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark)
    .text(creditReason || 'VIP chauffeur on arrival, Geneva (LSGG), 20 Nov 2026', 45, rowY + 12);
  doc.text(formatCurrency(-creditAmount, currency), 460, rowY, { width: 90, align: 'right' });

  rowY += 28;
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text('VAT [as on the original invoice]', 45, rowY);
  doc.text(formatCurrency(0, currency), 460, rowY, { width: 90, align: 'right' });

  rowY += 16;
  doc.moveTo(45, rowY).lineTo(550, rowY).lineWidth(0.8).strokeColor(COLORS.dark).stroke();
  rowY += 6;
  doc.font(FONTS.bold).fontSize(9.5).fillColor(COLORS.dark).text('Total credited', 45, rowY);
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.dark).text(formatCurrency(-creditAmount, currency), 460, rowY, { width: 90, align: 'right' });

  doc.y = rowY + 26;

  // TRIP BALANCE AFTER THIS CREDIT NOTE
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('TRIP BALANCE AFTER THIS CREDIT NOTE', 45, doc.y);
  doc.y += 10;
  let tbY = doc.y;
  const drawBalRow = (lbl, val, isBold = false) => {
    doc.moveTo(45, tbY).lineTo(550, tbY).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
    tbY += 5;
    doc.font(isBold ? FONTS.bold : FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(lbl, 45, tbY);
    doc.font(isBold ? FONTS.bold : FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(val, 400, tbY, { width: 150, align: 'right' });
    tbY += 14;
  };
  drawBalRow(`Invoiced · INV-${tripRef}-01, INV-${tripRef}-02`, formatCurrency(8250, currency));
  drawBalRow(`Credited · ${creditNoteNum}`, formatCurrency(-creditAmount, currency));
  drawBalRow('Received', formatCurrency(-8000, currency));
  drawBalRow('Balance', formatCurrency(0, currency), true);
  doc.moveTo(45, tbY).lineTo(550, tbY).lineWidth(0.5).strokeColor('#E2E8F0').stroke();

  doc.y = tbY + 10;
  doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(`${againstInv} is now settled. No payment is due and no refund is owed.`, 45, doc.y);

  doc.y += 20;
  // Design notes box
  const noteBoxY = doc.y;
  doc.roundedRect(45, noteBoxY, doc.page.width - 90, 50, 4).lineWidth(0.8).dash(3, { space: 3 }).strokeColor('#CBD5E1');
  doc.undash();
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.dark).text('Design notes for the developer (not printed)', 55, noteBoxY + 8);
  doc.font(FONTS.normal).fontSize(7).fillColor(COLORS.gray)
    .text('The reason chosen in the app (here: Complimentary service) is internal and never printed. When the client has overpaid, the balance block ends with “Refund due to you: € …” and the refund method.', 55, noteBoxY + 20, { width: doc.page.width - 110 });

  drawFooter(doc, `${creditNoteNum} · ${clientName}`, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate PDF Flight Brief
 */
const generateFlightBriefPDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, booking);
  const bufferPromise = docToBuffer(doc);

  const tripRef = booking.tripNumber || 'FE4578';
  const briefId = `FB-${tripRef}-005`;
  const firstLeg = booking.legs && booking.legs.length > 0 ? booking.legs[0] : null;

  const startY = doc.y;
  doc.font(FONTS.bold).fontSize(20).fillColor(COLORS.dark).text('Flight brief', 45, startY);

  const metaLabels = ['BRIEF', 'TRIP', 'ISSUED', 'STATUS'];
  const metaValues = [
    briefId,
    tripRef,
    `${booking.contractDate || '18 Nov 2026'}, 10:00`,
    'Confirmed',
  ];

  let metaY = startY;
  metaLabels.forEach((label, i) => {
    doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text(label, 320, metaY, { width: 80, align: 'right' });
    doc.font(FONTS.normal).fontSize(8.5).fillColor(COLORS.dark).text(metaValues[i], 410, metaY, { width: 140, align: 'right' });
    metaY += 13;
  });

  doc.y = Math.max(doc.y, metaY) + 14;

  // 3 Cards: Departure, Arrival, Aircraft
  const cardY = doc.y;
  const cardWidth = 160;
  // Departure
  doc.roundedRect(45, cardY, cardWidth, 68, 4).strokeColor('#E2E8F0').stroke();
  doc.font(FONTS.bold).fontSize(7).fillColor(COLORS.gray).text('DEPARTURE', 55, cardY + 8);
  doc.font(FONTS.bold).fontSize(13).fillColor(COLORS.dark).text(`${firstLeg?.origin?.icao || 'LEIB'} ${firstLeg?.departureTimeLocal || '10:00'}`, 55, cardY + 20);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.gray).text('Fri 20 Nov 2026 · local time', 55, cardY + 38);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark).text(firstLeg?.origin?.name || 'Ibiza Airport', 55, cardY + 50);

  // Arrival
  doc.roundedRect(215, cardY, cardWidth, 68, 4).strokeColor('#E2E8F0').stroke();
  doc.font(FONTS.bold).fontSize(7).fillColor(COLORS.gray).text('ARRIVAL', 225, cardY + 8);
  doc.font(FONTS.bold).fontSize(13).fillColor(COLORS.dark).text(`${firstLeg?.destination?.icao || 'LSGG'} ${firstLeg?.arrivalTimeLocal || '12:05'}`, 225, cardY + 20);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.gray).text('Fri 20 Nov 2026 · local time', 225, cardY + 38);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark).text(firstLeg?.destination?.name || 'Geneva Airport', 225, cardY + 50);

  // Aircraft
  doc.roundedRect(385, cardY, cardWidth + 5, 68, 4).strokeColor('#E2E8F0').stroke();
  doc.font(FONTS.bold).fontSize(7).fillColor(COLORS.gray).text('AIRCRAFT', 395, cardY + 8);
  doc.font(FONTS.bold).fontSize(13).fillColor(COLORS.dark).text(booking.aircraft?.name || 'CJ3+', 395, cardY + 20);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.gray).text(`Registration [${booking.aircraft?.registration || 'XX-XXX'}]`, 395, cardY + 38);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark).text(`Flight time ≈ ${firstLeg?.flightTimeFormatted || '2 h 05'}`, 395, cardY + 50);

  doc.y = cardY + 82;

  // Where to Go & On Arrival
  const fboY = doc.y;
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('WHERE TO GO · IBIZA', 45, fboY);
  doc.font(FONTS.bold).fontSize(8.5).fillColor(COLORS.dark).text('Ibiza Executive Terminal (FBO)', 45, fboY + 12);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark)
    .text('[FBO address]', 45, fboY + 24)
    .text('[FBO phone]', 45, fboY + 34)
    .text('Please arrive 30 minutes before departure with passports.', 45, fboY + 48, { width: 230 });

  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('ON ARRIVAL · GENEVA', 315, fboY);
  doc.font(FONTS.bold).fontSize(8.5).fillColor(COLORS.dark).text('Jet Aviation Geneva (FBO)', 315, fboY + 12);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark)
    .text('[FBO address]', 315, fboY + 24)
    .text('[FBO phone]', 315, fboY + 34)
    .text('Chauffeur meets you at the aircraft: Mercedes S-Class, driver with name board, to Hotel des Bergues.', 315, fboY + 48, { width: 230 });

  doc.y = fboY + 76;

  // Passengers Table
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('PASSENGERS', 45, doc.y);
  doc.y += 8;
  let pY = doc.y;
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.gray).text('NAME', 45, pY);
  doc.text('TRAVEL DOCUMENT', 240, pY);
  doc.text('NOTE', 440, pY);
  doc.moveTo(45, pY + 12).lineTo(550, pY + 12).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
  pY += 16;

  const paxList = [
    { name: `${booking.client?.fullName || 'Mr Tunde Adeyemi'} (lead)`, doc: 'Passport · Nigeria', note: '' },
    { name: 'Mrs Ada Adeyemi', doc: 'Passport · Nigeria', note: '' },
    { name: 'Miss Kemi Adeyemi', doc: 'Passport · Nigeria', note: '' },
    { name: 'Mr Bayo Adeyemi', doc: 'Passport · Nigeria', note: '' },
    { name: 'Toby (dog, 3 kg)', doc: 'Pet passport', note: 'In cabin' },
  ];

  paxList.forEach((pax) => {
    doc.font(FONTS.normal).fontSize(8).fillColor(COLORS.dark).text(pax.name, 45, pY);
    doc.text(pax.doc, 240, pY);
    doc.text(pax.note, 440, pY);
    pY += 14;
  });

  doc.font(FONTS.normal).fontSize(7).fillColor(COLORS.gray)
    .text("Document numbers are not printed on the client's brief. The operator receives the full manifest separately.", 45, pY + 2);

  doc.y = pY + 18;

  // Bottom Section: On Board & 24/7 Contact
  const bY = doc.y;
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.dark).text('ON BOARD', 45, bY);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark)
    .text('Catering: VIP menu 2, light lunch, 1 vegetarian', 45, bY + 12)
    .text('Luggage: 4 suitcases, 2 soft bags', 45, bY + 23)
    .text('Crew: [captain, first officer — from operator]', 45, bY + 34);

  // 24/7 Contact Box
  doc.roundedRect(315, bY - 4, 235, 52, 4).strokeColor(COLORS.dark).stroke();
  doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.dark).text('24/7 CONTACT', 325, bY + 4);
  doc.font(FONTS.normal).fontSize(7.5).fillColor(COLORS.dark)
    .text('Orbelo operations: [+356 24/7 number]', 325, bY + 16)
    .text(`Your representative: ${booking.agentName || 'Marcus Vance'}, +44 20 7946 0912`, 325, bY + 28);

  drawFooter(doc, `${briefId} · from version -005`, 1, 1);
  doc.end();
  return bufferPromise;
};

/**
 * Generate Passenger Manifest PDF
 */
const generatePassengerManifestPDF = async (booking) => {
  const doc = createBaseDocument();
  drawHeader(doc, booking);
  const bufferPromise = docToBuffer(doc);

  const tripRef = booking.tripNumber || 'FE4578';
  doc.font(FONTS.bold).fontSize(18).fillColor(COLORS.dark).text('Passenger manifest', 45, doc.y);
  doc.y += 10;

  drawFooter(doc, `PM-${tripRef} · Manifest`, 1, 1);
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

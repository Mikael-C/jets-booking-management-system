/**
 * Pricing Service — mirrors the frontend pricingCalculator.ts logic exactly.
 * All calculations are deterministic and match the UI.
 */

const CARD_FEE_PERCENTAGE = 3.5;
const DEFAULT_CRUISE_SPEED_KTAS = 450;

/**
 * Calculate great-circle distance in nautical miles using Haversine formula
 */
const calculateDistanceNm = (lat1, lon1, lat2, lon2) => {
  const R = 3440.065; // Earth radius in nautical miles
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Estimate flight time in minutes given distance and cruise speed
 * Adds 15 minutes for taxi/climb/descent buffer
 */
const estimateFlightTimeMinutes = (distanceNm, cruiseSpeedKtas = DEFAULT_CRUISE_SPEED_KTAS) => {
  if (!distanceNm || distanceNm <= 0) return 0;
  const speedKtas = cruiseSpeedKtas || DEFAULT_CRUISE_SPEED_KTAS;
  const flightTimeHours = distanceNm / speedKtas;
  const bufferMinutes = 15;
  return Math.round(flightTimeHours * 60 + bufferMinutes);
};

/**
 * Apply margin (percentage or fixed amount) to a base cost
 */
const applyMargin = (baseCost, marginType, marginValue) => {
  if (!marginValue || marginValue <= 0) return 0;
  if (marginType === 'percentage') {
    return (baseCost * marginValue) / 100;
  }
  return marginValue; // fixed amount
};

/**
 * Calculate card processing fee
 */
const calculateCardFee = (totalAmount, feePercentage = CARD_FEE_PERCENTAGE) => {
  if (!totalAmount || totalAmount <= 0) return 0;
  return (totalAmount * feePercentage) / 100;
};

/**
 * Calculate fuel surcharge based on distance and aircraft category
 */
const calculateFuelSurcharge = (distanceNm, category) => {
  const ratePerNm = {
    light: 1.2,
    midsize: 1.8,
    'super-midsize': 2.4,
    large: 3.2,
    'ultra-long-range': 4.5,
  };
  const rate = ratePerNm[category] || 2.0;
  return Math.round(distanceNm * rate);
};

/**
 * Main pricing calculation — matches frontend pricingCalculator.ts
 */
const calculatePricing = (aircraft, legs, services = {}, options = {}) => {
  const opts = typeof options === 'string' ? { currency: options } : (options || {});
  const {
    adminMarginType = 'percentage',
    adminMarginValue = 0,
    agentMarginType = 'percentage',
    agentMarginValue = 0,
    vatRate = 0,
    paymentMethodChoice = 'bank_transfer',
    manualServices = [],
    currency = 'EUR',
  } = opts;

  if (!aircraft || !legs || legs.length === 0) {
    return {
      currency,
      baseCharterCost: 0,
      fuelSurcharge: 0,
      landingFees: 0,
      handlingFees: 0,
      cateringCost: 0,
      crewCost: 0,
      repositioningFee: 0,
      additionalServicesCost: 0,
      subtotal: 0,
      adminMargin: 0,
      adminMarginPercentage: adminMarginType === 'percentage' ? adminMarginValue : 0,
      agentMargin: 0,
      agentMarginPercentage: agentMarginType === 'percentage' ? agentMarginValue : 0,
      totalBeforeTax: 0,
      vatRate,
      vatAmount: 0,
      totalAmount: 0,
      cardFee: 0,
      grandTotal: 0,
    };
  }

  const pricePerHour = aircraft.pricePerHour || 0;
  const cruiseSpeedKtas = aircraft.cruiseSpeedKtas || DEFAULT_CRUISE_SPEED_KTAS;
  const category = aircraft.category || 'midsize';

  // Calculate base charter cost from flight legs
  let totalFlightTimeMinutes = 0;
  let totalDistanceNm = 0;
  let landingFees = 0;
  let handlingFees = 0;

  legs.forEach((leg) => {
    let legFlightTime = leg.flightTimeMinutes || 0;
    let legDistance = leg.distanceNm || 0;

    if (!legFlightTime && leg.fromCoords && leg.toCoords) {
      legDistance = calculateDistanceNm(
        leg.fromCoords.lat, leg.fromCoords.lng,
        leg.toCoords.lat, leg.toCoords.lng
      );
      legFlightTime = estimateFlightTimeMinutes(legDistance, cruiseSpeedKtas);
    } else if (!legFlightTime && legDistance) {
      legFlightTime = estimateFlightTimeMinutes(legDistance, cruiseSpeedKtas);
    }

    totalFlightTimeMinutes += legFlightTime;
    totalDistanceNm += legDistance;

    // Per-leg landing and handling fees
    landingFees += estimateLandingFee(leg.toIcao);
    handlingFees += estimateHandlingFee(category);
  });

  const flightTimeHours = totalFlightTimeMinutes / 60;
  const baseCharterCost = Math.round(pricePerHour * flightTimeHours);

  // Fuel surcharge
  const fuelSurcharge = totalDistanceNm > 0
    ? calculateFuelSurcharge(totalDistanceNm, category)
    : Math.round(baseCharterCost * 0.08);

  // Catering cost
  let cateringCost = 0;
  if (services.catering) {
    const maxPax = Math.max(...legs.map((l) => l.paxCount || 1));
    cateringCost = maxPax * 85; // $85 per pax base catering
  }

  // Crew cost (long haul adds crew expenses)
  let crewCost = 0;
  if (totalFlightTimeMinutes > 480) {
    // Flights over 8 hours: crew overnight
    crewCost = Math.round(totalFlightTimeMinutes / 60) * 150;
  }

  // Additional services cost from manual services
  const additionalServicesCost = manualServices.reduce((sum, s) => sum + (s.amount || 0), 0);

  // Services from checkboxes
  let servicesCost = 0;
  if (services.groundTransport) servicesCost += 350;
  if (services.flightAttendant) servicesCost += 650;
  if (services.wifiOnboard) servicesCost += 200;
  if (services.customSecurity) servicesCost += 800;
  if (services.flowerArrangement) servicesCost += 150;
  if (services.concierge) servicesCost += 300;

  const subtotal = baseCharterCost + fuelSurcharge + landingFees + handlingFees +
    cateringCost + crewCost + servicesCost + additionalServicesCost;

  // Apply margins
  const adminMargin = applyMargin(subtotal, adminMarginType, adminMarginValue);
  const agentMargin = applyMargin(subtotal, agentMarginType, agentMarginValue);

  const totalBeforeTax = subtotal + adminMargin + agentMargin;

  const vatAmount = vatRate > 0 ? (totalBeforeTax * vatRate) / 100 : 0;
  const totalAmount = totalBeforeTax + vatAmount;

  const cardFee = paymentMethodChoice === 'credit_card'
    ? calculateCardFee(totalAmount)
    : 0;

  const grandTotal = totalAmount + cardFee;

  return {
    currency,
    baseCharterCost: round2(baseCharterCost),
    fuelSurcharge: round2(fuelSurcharge),
    landingFees: round2(landingFees),
    handlingFees: round2(handlingFees),
    cateringCost: round2(cateringCost),
    crewCost: round2(crewCost),
    repositioningFee: 0,
    additionalServicesCost: round2(additionalServicesCost + servicesCost),
    subtotal: round2(subtotal),
    adminMargin: round2(adminMargin),
    adminMarginPercentage: adminMarginType === 'percentage' ? adminMarginValue : 0,
    agentMargin: round2(agentMargin),
    agentMarginPercentage: agentMarginType === 'percentage' ? agentMarginValue : 0,
    totalBeforeTax: round2(totalBeforeTax),
    vatRate,
    vatAmount: round2(vatAmount),
    totalAmount: round2(totalAmount),
    cardFee: round2(cardFee),
    grandTotal: round2(grandTotal),
    // Aliases matching frontend PricingBreakdown interface
    flightPrice: round2(baseCharterCost),
    totalFlightPrice: round2(grandTotal || totalAmount),
    airportFees: round2(landingFees + handlingFees),
    passengerFees: 0,
    additionalServicesTotal: round2(additionalServicesCost + servicesCost),
  };
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Estimate landing fee based on airport type (heuristic)
const estimateLandingFee = (icao) => {
  if (!icao) return 500;
  const upper = icao.toUpperCase();
  // Major hubs
  const majorHubs = ['EGLL', 'LFPG', 'LSGG', 'KJFK', 'KLAX', 'OMDB', 'VHHH', 'RJTT'];
  if (majorHubs.includes(upper)) return 2500;
  // Private/executive
  const privateAirports = ['EGKB', 'EGLF', 'KTEB', 'KHPN', 'KVNY'];
  if (privateAirports.includes(upper)) return 800;
  return 1200; // Default landing fee
};

// Estimate handling fee based on aircraft category
const estimateHandlingFee = (category) => {
  const fees = {
    light: 400,
    midsize: 600,
    'super-midsize': 800,
    large: 1200,
    'ultra-long-range': 1800,
  };
  return fees[category] || 600;
};

module.exports = {
  calculateDistanceNm,
  estimateFlightTimeMinutes,
  calculatePricing,
  calculateCardFee,
  applyMargin,
  estimateLandingFee,
  estimateHandlingFee,
  calculateFuelSurcharge,
  CARD_FEE_PERCENTAGE,
};

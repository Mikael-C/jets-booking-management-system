const axios = require('axios');
const avinodeConfig = require('../config/avinode');
const logger = require('../middleware/logger');
const { createAuditEntry } = require('./auditService');

const { v4: uuidv4 } = require('uuid');

// =============================================
// MOCK DATA — Realistic aviation data for dev
// =============================================

const MOCK_AIRCRAFT_TYPES = [
  { id: 'mock-g650', name: 'Gulfstream G650', manufacturer: 'Gulfstream', category: 'ultra-long-range', registration: 'N650GL', passengers: 14, range: 7000, pricePerHour: 12000, cruiseSpeedKtas: 561 },
  { id: 'mock-g550', name: 'Gulfstream G550', manufacturer: 'Gulfstream', category: 'large', registration: 'N550GV', passengers: 16, range: 6750, pricePerHour: 9500, cruiseSpeedKtas: 488 },
  { id: 'mock-cl605', name: 'Bombardier Challenger 605', manufacturer: 'Bombardier', category: 'large', registration: 'C-FWJT', passengers: 12, range: 4000, pricePerHour: 7800, cruiseSpeedKtas: 450 },
  { id: 'mock-cl350', name: 'Bombardier Challenger 350', manufacturer: 'Bombardier', category: 'super-midsize', registration: 'C-GCLA', passengers: 10, range: 3200, pricePerHour: 5500, cruiseSpeedKtas: 440 },
  { id: 'mock-p31', name: 'Pilatus PC-24', manufacturer: 'Pilatus', category: 'light', registration: 'HB-VDI', passengers: 8, range: 2000, pricePerHour: 3200, cruiseSpeedKtas: 440 },
  { id: 'mock-e35l', name: 'Embraer Legacy 650', manufacturer: 'Embraer', category: 'large', registration: 'PT-XJT', passengers: 14, range: 3900, pricePerHour: 8200, cruiseSpeedKtas: 460 },
  { id: 'mock-g280', name: 'Gulfstream G280', manufacturer: 'Gulfstream', category: 'super-midsize', registration: 'N280GS', passengers: 10, range: 3600, pricePerHour: 5800, cruiseSpeedKtas: 460 },
  { id: 'mock-cl300', name: 'Bombardier Learjet 75 Liberty', manufacturer: 'Bombardier', category: 'midsize', registration: 'C-FLLJ', passengers: 8, range: 2040, pricePerHour: 4100, cruiseSpeedKtas: 465 },
];

const MOCK_OPERATORS = [
  { id: 'mock-op1', name: 'VistaJet', aoc: 'MT-AOC-001', country: 'Malta', email: 'ops@vistajet.com', safetyRating: 5, isArgusRated: true },
  { id: 'mock-op2', name: 'NetJets Europe', aoc: 'PT-AOC-002', country: 'Portugal', email: 'ops@netjets.eu', safetyRating: 5, isArgusRated: true },
  { id: 'mock-op3', name: 'Air Charter Service', aoc: 'GB-AOC-003', country: 'United Kingdom', email: 'charter@aircharterservice.com', safetyRating: 4, isArgusRated: true },
  { id: 'mock-op4', name: 'Luxaviation', aoc: 'LU-AOC-004', country: 'Luxembourg', email: 'ops@luxaviation.com', safetyRating: 4, isArgusRated: false },
  { id: 'mock-op5', name: 'TAG Aviation', aoc: 'CH-AOC-005', country: 'Switzerland', email: 'ops@tagaviation.com', safetyRating: 5, isWyvernRated: true },
];

const generateMockSearchResults = (params) => {
  const { paxCount = 4, aircraftCategory } = params;
  let aircraft = MOCK_AIRCRAFT_TYPES.filter((a) => a.passengers >= paxCount);
  if (aircraftCategory && aircraftCategory !== 'any') {
    aircraft = aircraft.filter((a) => a.category === aircraftCategory);
  }
  if (aircraft.length === 0) aircraft = MOCK_AIRCRAFT_TYPES;

  return aircraft.slice(0, 5).map((a, i) => {
    const operator = MOCK_OPERATORS[i % MOCK_OPERATORS.length];
    const basePriceMultiplier = 1 + (Math.random() * 0.3 - 0.15);
    const estimatedPrice = Math.round(a.pricePerHour * 3.5 * basePriceMultiplier);
    return {
      id: `avinode-mock-${uuidv4().split('-')[0]}`,
      aircraft: { ...a },
      operator: { ...operator },
      priceUSD: estimatedPrice,
      currency: 'USD',
      flightTime: '3h 30m',
      flightTimeMinutes: 210,
      availability: 'available',
      source: 'avinode_mock',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  });
};

// =============================================
// REAL AVINODE API CALLS
// =============================================

const avinodeClient = axios.create({
  baseURL: avinodeConfig.baseUrl,
  timeout: avinodeConfig.timeout,
  headers: avinodeConfig.getHeaders(),
});

// Add retry interceptor
avinodeClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || config.__retryCount >= avinodeConfig.retryAttempts) {
      return Promise.reject(error);
    }
    config.__retryCount = (config.__retryCount || 0) + 1;
    const delay = avinodeConfig.retryDelay * config.__retryCount;
    await new Promise((r) => setTimeout(r, delay));
    return avinodeClient(config);
  }
);

const callAvinode = async (method, endpoint, data = null, params = null) => {
  if (avinodeConfig.mockMode) {
    logger.info(`[Avinode MOCK] ${method.toUpperCase()} ${endpoint}`);
    return null; // Signal to use mock data
  }

  try {
    const response = await avinodeClient({
      method,
      url: endpoint,
      data,
      params,
    });
    return response.data;
  } catch (error) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.message || error.message;
    logger.error(`[Avinode API] ${method.toUpperCase()} ${endpoint} failed: ${statusCode} - ${message}`);
    throw {
      statusCode: statusCode || 503,
      message: `Avinode API error: ${message}`,
      avinodeError: true,
    };
  }
};

// =============================================
// SERVICE METHODS
// =============================================

/**
 * Search for available aircraft and charter options
 */
const searchTrips = async (params, user = null) => {
  const { originIcao, destIcao, date, paxCount, aircraftCategory } = params;

  const realData = await callAvinode('post', avinodeConfig.endpoints.searchFleet, {
    origin: originIcao,
    destination: destIcao,
    departureDate: date,
    passengerCount: paxCount,
    aircraftCategory,
  });

  if (realData) {
    return transformAvinodeSearchResults(realData);
  }

  // Mock mode fallback
  const results = generateMockSearchResults({ paxCount, aircraftCategory });

  if (user) {
    await createAuditEntry({
      user,
      action: 'avinode_search',
      entityType: 'avinode',
      details: { originIcao, destIcao, date, paxCount, aircraftCategory, resultCount: results.length },
    });
  }

  return results;
};

/**
 * Get trip details by Avinode trip ID
 */
const getTripDetails = async (tripId) => {
  const realData = await callAvinode('get', `${avinodeConfig.endpoints.trips}/${tripId}`);
  if (realData) return realData;

  // Mock response
  return {
    id: tripId,
    status: 'active',
    aircraft: MOCK_AIRCRAFT_TYPES[0],
    operator: MOCK_OPERATORS[0],
    price: 45000,
    currency: 'USD',
    source: 'avinode_mock',
  };
};

/**
 * Create a trip in Avinode
 */
const createTrip = async (tripData) => {
  const realData = await callAvinode('post', avinodeConfig.endpoints.trips, tripData);
  if (realData) return realData;

  // Mock: return a fake Avinode trip ID
  return {
    id: `AVN-${Date.now()}`,
    status: 'created',
    tripData,
    source: 'avinode_mock',
  };
};

/**
 * Send RFQ to operators through Avinode
 */
const sendRFQ = async (rfqData) => {
  const realData = await callAvinode('post', avinodeConfig.endpoints.rfq, rfqData);
  if (realData) return realData;

  // Mock RFQ response
  return {
    rfqId: `RFQ-${Date.now()}`,
    status: 'sent',
    operatorsContacted: rfqData.operatorIds?.length || 3,
    expectedResponseTime: '2 hours',
    source: 'avinode_mock',
  };
};

/**
 * Get RFQ responses
 */
const getRFQResponses = async (rfqId) => {
  const realData = await callAvinode('get', `${avinodeConfig.endpoints.rfq}/${rfqId}`);
  if (realData) return realData;

  // Mock RFQ responses
  return {
    rfqId,
    status: 'completed',
    responses: MOCK_OPERATORS.slice(0, 3).map((op, i) => ({
      operatorId: op.id,
      operatorName: op.name,
      price: 35000 + (i * 5000),
      currency: 'USD',
      aircraft: MOCK_AIRCRAFT_TYPES[i],
      validUntil: new Date(Date.now() + 24 * 3600000).toISOString(),
    })),
    source: 'avinode_mock',
  };
};

/**
 * Book a trip via Avinode
 */
const bookTrip = async (tripId, bookingData) => {
  const realData = await callAvinode('post', avinodeConfig.endpoints.trips + `/${tripId}/book`, bookingData);
  if (realData) return realData;

  return {
    confirmationId: `CONF-${Date.now()}`,
    tripId,
    status: 'confirmed',
    bookingData,
    source: 'avinode_mock',
  };
};

/**
 * Search Avinode operator directory
 */
const searchOperators = async (params = {}) => {
  const realData = await callAvinode('get', avinodeConfig.endpoints.operators, null, params);
  if (realData) return realData;

  return {
    operators: MOCK_OPERATORS,
    total: MOCK_OPERATORS.length,
    source: 'avinode_mock',
  };
};

/**
 * Search Avinode aircraft database
 */
const searchAircraft = async (params = {}) => {
  const realData = await callAvinode('get', avinodeConfig.endpoints.aircraft, null, params);
  if (realData) return realData;

  let results = MOCK_AIRCRAFT_TYPES;
  if (params.category) results = results.filter((a) => a.category === params.category);
  if (params.minPax) results = results.filter((a) => a.passengers >= params.minPax);

  return {
    aircraft: results,
    total: results.length,
    source: 'avinode_mock',
  };
};

/**
 * Search airports via Avinode
 */
const searchAirports = async (query) => {
  const realData = await callAvinode('get', avinodeConfig.endpoints.airports, null, { q: query });
  if (realData) return realData;

  const { searchAirports: localSearch } = require('../utils/airportData');
  return { airports: localSearch(query, 20), source: 'avinode_mock' };
};

/**
 * Get quotes from Avinode marketplace
 */
const getMarketplaceQuotes = async (params = {}) => {
  const realData = await callAvinode('get', avinodeConfig.endpoints.quotes, null, params);
  if (realData) return realData;

  return {
    quotes: generateMockSearchResults(params),
    total: 5,
    source: 'avinode_mock',
  };
};

/**
 * Send message to operator via Avinode
 */
const sendMessage = async (tripId, message) => {
  const realData = await callAvinode('post', avinodeConfig.endpoints.messaging, { tripId, message });
  if (realData) return realData;

  return {
    messageId: `MSG-${Date.now()}`,
    tripId,
    status: 'sent',
    timestamp: new Date().toISOString(),
    source: 'avinode_mock',
  };
};

/**
 * Get message thread for a trip
 */
const getMessages = async (tripId) => {
  const realData = await callAvinode('get', `${avinodeConfig.endpoints.messaging}/${tripId}`);
  if (realData) return realData;

  return {
    tripId,
    messages: [
      { id: 'msg-1', from: 'operator@example.com', message: 'Aircraft confirmed available', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'msg-2', from: 'ops@orbelo.com', message: 'Please confirm pricing and ETA', timestamp: new Date(Date.now() - 1800000).toISOString() },
    ],
    source: 'avinode_mock',
  };
};

/**
 * Check fleet availability
 */
const checkFleetAvailability = async (params = {}) => {
  const realData = await callAvinode('get', avinodeConfig.endpoints.fleetAvailability, null, params);
  if (realData) return realData;

  return {
    available: MOCK_AIRCRAFT_TYPES.map((a) => ({
      ...a,
      available: Math.random() > 0.3,
      nextAvailable: new Date(Date.now() + Math.random() * 7 * 24 * 3600000).toISOString(),
    })),
    source: 'avinode_mock',
  };
};

/**
 * Calculate automated quote via Avinode
 */
const calculateQuote = async (quoteParams) => {
  const realData = await callAvinode('post', avinodeConfig.endpoints.calculateQuote, quoteParams);
  if (realData) return realData;

  const { pricingService } = require('./pricingService');
  const aircraft = MOCK_AIRCRAFT_TYPES.find((a) => a.id === quoteParams.aircraftId) || MOCK_AIRCRAFT_TYPES[0];
  return {
    aircraftId: quoteParams.aircraftId || aircraft.id,
    aircraft,
    estimatedTotal: aircraft.pricePerHour * 3.5,
    currency: 'USD',
    breakdown: {
      charterCost: aircraft.pricePerHour * 3,
      fuelSurcharge: aircraft.pricePerHour * 0.3,
      fees: aircraft.pricePerHour * 0.2,
    },
    source: 'avinode_mock',
  };
};

/**
 * Transform Avinode search results to internal format
 */
const transformAvinodeSearchResults = (avinodeData) => {
  if (!avinodeData || !avinodeData.results) return [];
  return avinodeData.results.map((item) => ({
    id: item.id || item.tripId,
    aircraft: {
      id: item.aircraft?.id,
      name: item.aircraft?.type || item.aircraft?.name,
      manufacturer: item.aircraft?.manufacturer,
      category: mapAvinodeCategory(item.aircraft?.category),
      registration: item.aircraft?.registration,
      passengers: item.aircraft?.passengerCapacity,
      range: item.aircraft?.rangeNm,
      pricePerHour: item.aircraft?.pricePerHour,
      cruiseSpeedKtas: item.aircraft?.cruiseSpeedKts,
    },
    operator: {
      id: item.operator?.id,
      name: item.operator?.name,
      aoc: item.operator?.aocNumber,
      country: item.operator?.country,
      email: item.operator?.contactEmail,
    },
    priceUSD: item.price?.totalUSD || item.totalPrice,
    currency: item.price?.currency || 'USD',
    flightTime: item.estimatedFlightTime,
    flightTimeMinutes: item.estimatedFlightTimeMinutes,
    availability: item.availability || 'available',
    source: 'avinode',
  }));
};

const mapAvinodeCategory = (avinodeCategory) => {
  const map = {
    'Light': 'light',
    'Midsize': 'midsize',
    'Super Midsize': 'super-midsize',
    'Large Cabin': 'large',
    'Ultra Long Range': 'ultra-long-range',
  };
  return map[avinodeCategory] || 'midsize';
};

module.exports = {
  searchTrips,
  getTripDetails,
  createTrip,
  sendRFQ,
  sendRfq: sendRFQ,
  getRFQResponses,
  getRfqResponses: getRFQResponses,
  bookTrip,
  searchOperators,
  searchAircraft,
  searchAirports,
  getMarketplaceQuotes,
  sendMessage,
  getMessages,
  checkFleetAvailability,
  calculateQuote,
  isMockMode: () => avinodeConfig.mockMode,
};

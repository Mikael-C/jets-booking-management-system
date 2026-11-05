const avinodeConfig = {
  apiKey: process.env.AVINODE_API_KEY || '',
  baseUrl: process.env.AVINODE_BASE_URL || 'https://api.avinode.com',
  mockMode: process.env.AVINODE_MOCK_MODE === 'true' || !process.env.AVINODE_API_KEY,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,

  getHeaders: () => ({
    'X-API-KEY': avinodeConfig.apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'Orbelo-Backend/1.0',
  }),

  endpoints: {
    searchFleet: '/v2/fleet/search',
    trips: '/v2/trips',
    rfq: '/v2/rfq',
    operators: '/v2/operators',
    aircraft: '/v2/aircraft',
    airports: '/v2/airports',
    quotes: '/v2/quotes',
    messaging: '/v2/messaging',
    fleetAvailability: '/v2/fleet/availability',
    calculateQuote: '/v2/quotes/calculate',
  },
};

module.exports = avinodeConfig;

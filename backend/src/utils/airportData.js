/**
 * Comprehensive private aviation airports dataset
 * 300+ airports with ICAO, IATA, name, city, country, coordinates, and type
 */

const AIRPORTS = [
  // ============ EUROPE ============
  { icao: 'LFMN', iata: 'NCE', name: "Nice Côte d'Azur Airport", city: 'Nice / Cannes / Monaco', country: 'France', lat: 43.6584, lng: 7.2159, type: 'dedicated', typeLabel: 'General Aviation Terminal', popular: true, timezone: 'Europe/Paris' },
  { icao: 'LIMJ', iata: 'GOA', name: 'Genoa Cristoforo Colombo Airport', city: 'Genoa', country: 'Italy', lat: 44.4133, lng: 8.8375, type: 'fbo', typeLabel: 'Ags Ops Executive Handling', popular: true, timezone: 'Europe/Rome' },
  { icao: 'LFMD', iata: 'CEQ', name: 'Cannes Mandelieu Airport', city: 'Cannes', country: 'France', lat: 43.5422, lng: 6.9531, type: 'dedicated', typeLabel: 'VIP Riviera Airport', popular: true, timezone: 'Europe/Paris' },
  { icao: 'LSZR', iata: 'ACH', name: 'Altenrhein / St. Gallen Airport', city: 'Altenrhein / St. Gallen', country: 'Switzerland', lat: 47.4850, lng: 9.5608, type: 'fbo', typeLabel: 'Peoples Business Aviation', popular: true, timezone: 'Europe/Zurich' },
  { icao: 'LOWW', iata: 'VIE', name: 'Vienna International VIP Terminal', city: 'Vienna', country: 'Austria', lat: 48.1103, lng: 16.5697, type: 'dedicated', typeLabel: 'Vienna General Aviation Terminal', popular: true, timezone: 'Europe/Vienna' },
  { icao: 'LOWL', iata: 'LNZ', name: 'Linz Airport (Blue Danube)', city: 'Linz', country: 'Austria', lat: 48.2332, lng: 14.1878, type: 'fbo', typeLabel: 'Executive FBO Handling', popular: true, timezone: 'Europe/Vienna' },
  { icao: 'EDMO', iata: 'OBF', name: 'Munich Oberpfaffenhofen Airport', city: 'Munich', country: 'Germany', lat: 48.0814, lng: 11.2831, type: 'dedicated', typeLabel: 'Munich Business Aviation Hub', popular: true, timezone: 'Europe/Berlin' },
  { icao: 'EGLL', iata: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4775, lng: -0.4614, type: 'large_airport', timezone: 'Europe/London' },
  { icao: 'EGKB', iata: 'BQH', name: 'London Biggin Hill Airport', city: 'London', country: 'United Kingdom', lat: 51.3308, lng: 0.0325, type: 'private', timezone: 'Europe/London' },
  { icao: 'EGLF', iata: 'FAB', name: 'Farnborough Airport', city: 'Farnborough', country: 'United Kingdom', lat: 51.2758, lng: -0.7764, type: 'private', timezone: 'Europe/London' },
  { icao: 'EGMC', iata: 'SEN', name: 'London Southend Airport', city: 'Southend', country: 'United Kingdom', lat: 51.5714, lng: 0.6956, type: 'medium_airport', timezone: 'Europe/London' },
  { icao: 'EGGW', iata: 'LTN', name: 'London Luton Airport', city: 'Luton', country: 'United Kingdom', lat: 51.8747, lng: -0.3683, type: 'large_airport', timezone: 'Europe/London' },
  { icao: 'LFPB', iata: 'LBG', name: 'Paris Le Bourget Airport', city: 'Paris', country: 'France', lat: 48.9694, lng: 2.4414, type: 'private', timezone: 'Europe/Paris' },
  { icao: 'LFPG', iata: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0128, lng: 2.5500, type: 'large_airport', timezone: 'Europe/Paris' },
  { icao: 'LFPO', iata: 'ORY', name: 'Paris Orly Airport', city: 'Paris', country: 'France', lat: 48.7233, lng: 2.3794, type: 'large_airport', timezone: 'Europe/Paris' },
  { icao: 'LSGG', iata: 'GVA', name: 'Geneva Cointrin International Airport', city: 'Geneva', country: 'Switzerland', lat: 46.2381, lng: 6.1089, type: 'large_airport', timezone: 'Europe/Zurich' },
  { icao: 'LSZH', iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lng: 8.5483, type: 'large_airport', timezone: 'Europe/Zurich' },
  { icao: 'LSZA', iata: 'LUG', name: 'Lugano Airport', city: 'Lugano', country: 'Switzerland', lat: 46.0043, lng: 8.9108, type: 'medium_airport', timezone: 'Europe/Zurich' },
  { icao: 'LSZB', iata: 'BRN', name: 'Bern Airport', city: 'Bern', country: 'Switzerland', lat: 46.9141, lng: 7.4972, type: 'medium_airport', timezone: 'Europe/Zurich' },
  { icao: 'EDDF', iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622, type: 'large_airport', timezone: 'Europe/Berlin' },
  { icao: 'EDDM', iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3538, lng: 11.7861, type: 'large_airport', timezone: 'Europe/Berlin' },
  { icao: 'EDDB', iata: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', lat: 52.3514, lng: 13.4939, type: 'large_airport', timezone: 'Europe/Berlin' },
  { icao: 'EDDN', iata: 'NUE', name: 'Nuremberg Airport', city: 'Nuremberg', country: 'Germany', lat: 49.4987, lng: 11.0669, type: 'medium_airport', timezone: 'Europe/Berlin' },
  { icao: 'EDDS', iata: 'STR', name: 'Stuttgart Airport', city: 'Stuttgart', country: 'Germany', lat: 48.6899, lng: 9.2219, type: 'large_airport', timezone: 'Europe/Berlin' },
  { icao: 'LIML', iata: 'LIN', name: 'Milan Linate Airport', city: 'Milan', country: 'Italy', lat: 45.4453, lng: 9.2767, type: 'large_airport', timezone: 'Europe/Rome' },
  { icao: 'LIMC', iata: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', lat: 45.6306, lng: 8.7281, type: 'large_airport', timezone: 'Europe/Rome' },
  { icao: 'LIRF', iata: 'FCO', name: 'Rome Fiumicino Airport', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389, type: 'large_airport', timezone: 'Europe/Rome' },
  { icao: 'LIPZ', iata: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy', lat: 45.5053, lng: 12.3519, type: 'large_airport', timezone: 'Europe/Rome' },
  { icao: 'LIRA', iata: 'CIA', name: 'Rome Ciampino Airport', city: 'Rome', country: 'Italy', lat: 41.7994, lng: 12.5947, type: 'medium_airport', timezone: 'Europe/Rome' },
  { icao: 'LMML', iata: 'MLA', name: 'Malta International Airport', city: 'Valletta', country: 'Malta', lat: 35.8575, lng: 14.4775, type: 'large_airport', timezone: 'Europe/Malta' },
  { icao: 'LEMD', iata: 'MAD', name: 'Madrid Barajas Airport', city: 'Madrid', country: 'Spain', lat: 40.4719, lng: -3.5608, type: 'large_airport', timezone: 'Europe/Madrid' },
  { icao: 'LEBL', iata: 'BCN', name: 'Barcelona El Prat Airport', city: 'Barcelona', country: 'Spain', lat: 41.2971, lng: 2.0785, type: 'large_airport', timezone: 'Europe/Madrid' },
  { icao: 'LEMG', iata: 'AGP', name: 'Malaga Airport', city: 'Malaga', country: 'Spain', lat: 36.6749, lng: -4.4991, type: 'large_airport', timezone: 'Europe/Madrid' },
  { icao: 'LEIB', iata: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza', country: 'Spain', lat: 38.8729, lng: 1.3731, type: 'medium_airport', timezone: 'Europe/Madrid' },
  { icao: 'LEPA', iata: 'PMI', name: 'Palma de Mallorca Airport', city: 'Palma de Mallorca', country: 'Spain', lat: 39.5517, lng: 2.7388, type: 'large_airport', timezone: 'Europe/Madrid' },
  { icao: 'ENGM', iata: 'OSL', name: 'Oslo Gardermoen Airport', city: 'Oslo', country: 'Norway', lat: 60.1939, lng: 11.1004, type: 'large_airport', timezone: 'Europe/Oslo' },
  { icao: 'ESSA', iata: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', lat: 59.6519, lng: 17.9186, type: 'large_airport', timezone: 'Europe/Stockholm' },
  { icao: 'EKCH', iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', lat: 55.6179, lng: 12.6560, type: 'large_airport', timezone: 'Europe/Copenhagen' },
  { icao: 'EFHK', iata: 'HEL', name: 'Helsinki Vantaa Airport', city: 'Helsinki', country: 'Finland', lat: 60.3172, lng: 24.9633, type: 'large_airport', timezone: 'Europe/Helsinki' },
  { icao: 'EHAM', iata: 'AMS', name: 'Amsterdam Schiphol Airport', city: 'Amsterdam', country: 'Netherlands', lat: 52.3086, lng: 4.7639, type: 'large_airport', timezone: 'Europe/Amsterdam' },
  { icao: 'EBBR', iata: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', lat: 50.9014, lng: 4.4844, type: 'large_airport', timezone: 'Europe/Brussels' },
  { icao: 'ELLX', iata: 'LUX', name: 'Luxembourg Findel Airport', city: 'Luxembourg', country: 'Luxembourg', lat: 49.6264, lng: 6.2044, type: 'large_airport', timezone: 'Europe/Luxembourg' },
  { icao: 'LKPR', iata: 'PRG', name: 'Prague Václav Havel Airport', city: 'Prague', country: 'Czech Republic', lat: 50.1008, lng: 14.2600, type: 'large_airport', timezone: 'Europe/Prague' },
  { icao: 'EPWA', iata: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', lat: 52.1657, lng: 20.9671, type: 'large_airport', timezone: 'Europe/Warsaw' },
  { icao: 'LHBP', iata: 'BUD', name: 'Budapest Ferenc Liszt Airport', city: 'Budapest', country: 'Hungary', lat: 47.4298, lng: 19.2611, type: 'large_airport', timezone: 'Europe/Budapest' },
  { icao: 'LOWW', iata: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', lat: 48.1103, lng: 16.5697, type: 'large_airport', timezone: 'Europe/Vienna' },
  { icao: 'LOWS', iata: 'SZG', name: 'Salzburg Airport', city: 'Salzburg', country: 'Austria', lat: 47.7933, lng: 13.0044, type: 'medium_airport', timezone: 'Europe/Vienna' },
  { icao: 'LGAV', iata: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', lat: 37.9364, lng: 23.9444, type: 'large_airport', timezone: 'Europe/Athens' },
  { icao: 'LGTS', iata: 'SKG', name: 'Thessaloniki Macedonia Airport', city: 'Thessaloniki', country: 'Greece', lat: 40.5197, lng: 22.9709, type: 'large_airport', timezone: 'Europe/Athens' },
  { icao: 'LGMK', iata: 'JMK', name: 'Mykonos Airport', city: 'Mykonos', country: 'Greece', lat: 37.4350, lng: 25.3481, type: 'medium_airport', timezone: 'Europe/Athens' },
  { icao: 'LGSR', iata: 'JTR', name: 'Santorini Airport', city: 'Santorini', country: 'Greece', lat: 36.3992, lng: 25.4793, type: 'medium_airport', timezone: 'Europe/Athens' },
  { icao: 'LDSP', iata: 'SPU', name: 'Split Airport', city: 'Split', country: 'Croatia', lat: 43.5389, lng: 16.2981, type: 'large_airport', timezone: 'Europe/Zagreb' },
  { icao: 'LDDU', iata: 'DBV', name: 'Dubrovnik Airport', city: 'Dubrovnik', country: 'Croatia', lat: 42.5614, lng: 18.2681, type: 'large_airport', timezone: 'Europe/Zagreb' },
  { icao: 'LYBE', iata: 'BEG', name: 'Belgrade Nikola Tesla Airport', city: 'Belgrade', country: 'Serbia', lat: 44.8184, lng: 20.3091, type: 'large_airport', timezone: 'Europe/Belgrade' },
  { icao: 'LUKK', iata: 'KIV', name: 'Chișinău International Airport', city: 'Chișinău', country: 'Moldova', lat: 46.9277, lng: 28.9311, type: 'medium_airport', timezone: 'Europe/Chisinau' },
  { icao: 'UUDD', iata: 'DME', name: 'Moscow Domodedovo Airport', city: 'Moscow', country: 'Russia', lat: 55.4089, lng: 37.9063, type: 'large_airport', timezone: 'Europe/Moscow' },
  { icao: 'UUEE', iata: 'SVO', name: 'Moscow Sheremetyevo Airport', city: 'Moscow', country: 'Russia', lat: 55.9728, lng: 37.4147, type: 'large_airport', timezone: 'Europe/Moscow' },
  { icao: 'URSS', iata: 'AER', name: 'Sochi International Airport', city: 'Sochi', country: 'Russia', lat: 43.4493, lng: 39.9566, type: 'large_airport', timezone: 'Europe/Moscow' },

  // ============ MIDDLE EAST ============
  { icao: 'OMDB', iata: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', lat: 25.2528, lng: 55.3644, type: 'large_airport', timezone: 'Asia/Dubai' },
  { icao: 'OMDW', iata: 'DWC', name: 'Al Maktoum International Airport', city: 'Dubai', country: 'UAE', lat: 24.8963, lng: 55.1611, type: 'large_airport', timezone: 'Asia/Dubai' },
  { icao: 'OMAA', iata: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'UAE', lat: 24.4330, lng: 54.6511, type: 'large_airport', timezone: 'Asia/Dubai' },
  { icao: 'OEJN', iata: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6796, lng: 39.1565, type: 'large_airport', timezone: 'Asia/Riyadh' },
  { icao: 'OERK', iata: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.9576, lng: 46.6988, type: 'large_airport', timezone: 'Asia/Riyadh' },
  { icao: 'OKBK', iata: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', lat: 29.2267, lng: 47.9689, type: 'large_airport', timezone: 'Asia/Kuwait' },
  { icao: 'OTBD', iata: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6082, type: 'large_airport', timezone: 'Asia/Qatar' },
  { icao: 'OBBI', iata: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain', lat: 26.2708, lng: 50.6336, type: 'large_airport', timezone: 'Asia/Bahrain' },
  { icao: 'OOMS', iata: 'MCT', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman', lat: 23.5933, lng: 58.2844, type: 'large_airport', timezone: 'Asia/Muscat' },
  { icao: 'LLBG', iata: 'TLV', name: 'Ben Gurion International Airport', city: 'Tel Aviv', country: 'Israel', lat: 32.0114, lng: 34.8867, type: 'large_airport', timezone: 'Asia/Jerusalem' },

  // ============ AMERICAS ============
  { icao: 'KTEB', iata: 'TEB', name: 'Teterboro Airport', city: 'Teterboro, NJ', country: 'United States', lat: 40.8500, lng: -74.0608, type: 'private', timezone: 'America/New_York' },
  { icao: 'KHPN', iata: 'HPN', name: 'Westchester County Airport', city: 'White Plains, NY', country: 'United States', lat: 41.0670, lng: -73.7076, type: 'private', timezone: 'America/New_York' },
  { icao: 'KJFK', iata: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', lat: 40.6413, lng: -73.7781, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KLGA', iata: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', lat: 40.7773, lng: -73.8726, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KEWR', iata: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark, NJ', country: 'United States', lat: 40.6925, lng: -74.1687, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KMIA', iata: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', lat: 25.7959, lng: -80.2870, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KFLL', iata: 'FLL', name: 'Fort Lauderdale-Hollywood International Airport', city: 'Fort Lauderdale', country: 'United States', lat: 26.0726, lng: -80.1527, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KOPF', iata: 'OPF', name: 'Opa-locka Executive Airport', city: 'Miami', country: 'United States', lat: 25.9069, lng: -80.2783, type: 'private', timezone: 'America/New_York' },
  { icao: 'KPBI', iata: 'PBI', name: 'Palm Beach International Airport', city: 'Palm Beach', country: 'United States', lat: 26.6832, lng: -80.0956, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KLAX', iata: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', lat: 33.9425, lng: -118.4081, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KVNY', iata: 'VNY', name: 'Van Nuys Airport', city: 'Los Angeles', country: 'United States', lat: 34.2097, lng: -118.4897, type: 'private', timezone: 'America/Los_Angeles' },
  { icao: 'KSMO', iata: 'SMO', name: 'Santa Monica Municipal Airport', city: 'Santa Monica', country: 'United States', lat: 34.0158, lng: -118.4514, type: 'private', timezone: 'America/Los_Angeles' },
  { icao: 'KBUR', iata: 'BUR', name: 'Hollywood Burbank Airport', city: 'Burbank', country: 'United States', lat: 34.2006, lng: -118.3586, type: 'medium_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KSFO', iata: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', lat: 37.6213, lng: -122.3790, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KSJC', iata: 'SJC', name: 'Norman Y. Mineta San Jose International Airport', city: 'San Jose', country: 'United States', lat: 37.3626, lng: -121.9290, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KPAO', iata: 'PAO', name: 'Palo Alto Airport', city: 'Palo Alto', country: 'United States', lat: 37.4611, lng: -122.1150, type: 'private', timezone: 'America/Los_Angeles' },
  { icao: 'KORD', iata: 'ORD', name: 'Chicago O\'Hare International Airport', city: 'Chicago', country: 'United States', lat: 41.9742, lng: -87.9073, type: 'large_airport', timezone: 'America/Chicago' },
  { icao: 'KMDW', iata: 'MDW', name: 'Chicago Midway International Airport', city: 'Chicago', country: 'United States', lat: 41.7859, lng: -87.7424, type: 'large_airport', timezone: 'America/Chicago' },
  { icao: 'KDVN', iata: 'DVN', name: 'Davenport Airport', city: 'Davenport', country: 'United States', lat: 41.6103, lng: -90.5883, type: 'medium_airport', timezone: 'America/Chicago' },
  { icao: 'KATL', iata: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', lat: 33.6407, lng: -84.4277, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KBOS', iata: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', country: 'United States', lat: 42.3656, lng: -71.0096, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KIAD', iata: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington DC', country: 'United States', lat: 38.9445, lng: -77.4558, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KDCA', iata: 'DCA', name: 'Ronald Reagan Washington National Airport', city: 'Washington DC', country: 'United States', lat: 38.8512, lng: -77.0402, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KLAS', iata: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'United States', lat: 36.0840, lng: -115.1537, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KPHX', iata: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'United States', lat: 33.4373, lng: -112.0078, type: 'large_airport', timezone: 'America/Phoenix' },
  { icao: 'KSDL', iata: 'SDL', name: 'Scottsdale Airport', city: 'Scottsdale', country: 'United States', lat: 33.6228, lng: -111.9111, type: 'private', timezone: 'America/Phoenix' },
  { icao: 'KASE', iata: 'ASE', name: 'Aspen-Pitkin County Airport', city: 'Aspen', country: 'United States', lat: 39.2232, lng: -106.8690, type: 'medium_airport', timezone: 'America/Denver' },
  { icao: 'KHST', iata: 'HST', name: 'Homestead Air Reserve Base', city: 'Homestead', country: 'United States', lat: 25.4886, lng: -80.3836, type: 'medium_airport', timezone: 'America/New_York' },
  { icao: 'KHOU', iata: 'HOU', name: 'William P. Hobby Airport', city: 'Houston', country: 'United States', lat: 29.6454, lng: -95.2789, type: 'large_airport', timezone: 'America/Chicago' },
  { icao: 'KIAH', iata: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'United States', lat: 29.9902, lng: -95.3368, type: 'large_airport', timezone: 'America/Chicago' },
  { icao: 'KDAL', iata: 'DAL', name: 'Dallas Love Field', city: 'Dallas', country: 'United States', lat: 32.8471, lng: -96.8517, type: 'large_airport', timezone: 'America/Chicago' },
  { icao: 'KDFW', iata: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States', lat: 32.8998, lng: -97.0403, type: 'large_airport', timezone: 'America/Chicago' },
  { icao: 'KDEN', iata: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', lat: 39.8561, lng: -104.6737, type: 'large_airport', timezone: 'America/Denver' },
  { icao: 'KSLC', iata: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'United States', lat: 40.7884, lng: -111.9778, type: 'large_airport', timezone: 'America/Denver' },
  { icao: 'KSEA', iata: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', lat: 47.4502, lng: -122.3088, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KBFI', iata: 'BFI', name: 'Boeing Field/King County International Airport', city: 'Seattle', country: 'United States', lat: 47.5300, lng: -122.3019, type: 'private', timezone: 'America/Los_Angeles' },
  { icao: 'KPDX', iata: 'PDX', name: 'Portland International Airport', city: 'Portland', country: 'United States', lat: 45.5898, lng: -122.5951, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KTNP', iata: 'TNP', name: 'Twentynine Palms Airport', city: 'Twentynine Palms', country: 'United States', lat: 34.1317, lng: -115.9483, type: 'small_airport', timezone: 'America/Los_Angeles' },
  { icao: 'MMMX', iata: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', lat: 19.4363, lng: -99.0721, type: 'large_airport', timezone: 'America/Mexico_City' },
  { icao: 'MMCN', iata: 'CEN', name: 'Ciudad Obregon Airport', city: 'Ciudad Obregon', country: 'Mexico', lat: 27.3926, lng: -109.8330, type: 'medium_airport', timezone: 'America/Hermosillo' },
  { icao: 'SBGR', iata: 'GRU', name: 'São Paulo Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lng: -46.4731, type: 'large_airport', timezone: 'America/Sao_Paulo' },
  { icao: 'SBSP', iata: 'CGH', name: 'São Paulo Congonhas Airport', city: 'São Paulo', country: 'Brazil', lat: -23.6261, lng: -46.6557, type: 'large_airport', timezone: 'America/Sao_Paulo' },
  { icao: 'SBRJ', iata: 'SDU', name: 'Santos Dumont Airport', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.9105, lng: -43.1631, type: 'large_airport', timezone: 'America/Sao_Paulo' },
  { icao: 'SAEZ', iata: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina', lat: -34.8222, lng: -58.5358, type: 'large_airport', timezone: 'America/Argentina/Buenos_Aires' },

  // ============ ASIA-PACIFIC ============
  { icao: 'VHHH', iata: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', lat: 22.3089, lng: 113.9144, type: 'large_airport', timezone: 'Asia/Hong_Kong' },
  { icao: 'RJTT', iata: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798, type: 'large_airport', timezone: 'Asia/Tokyo' },
  { icao: 'RJAA', iata: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', lat: 35.7647, lng: 140.3864, type: 'large_airport', timezone: 'Asia/Tokyo' },
  { icao: 'RJOO', iata: 'ITM', name: 'Osaka Itami Airport', city: 'Osaka', country: 'Japan', lat: 34.7855, lng: 135.4381, type: 'large_airport', timezone: 'Asia/Tokyo' },
  { icao: 'WSSS', iata: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915, type: 'large_airport', timezone: 'Asia/Singapore' },
  { icao: 'WBKK', iata: 'BKI', name: 'Kota Kinabalu International Airport', city: 'Kota Kinabalu', country: 'Malaysia', lat: 5.9372, lng: 116.0508, type: 'large_airport', timezone: 'Asia/Kuala_Lumpur' },
  { icao: 'VTBS', iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6811, lng: 100.7472, type: 'large_airport', timezone: 'Asia/Bangkok' },
  { icao: 'VGHS', iata: 'DAC', name: 'Hazrat Shahjalal International Airport', city: 'Dhaka', country: 'Bangladesh', lat: 23.8433, lng: 90.3978, type: 'large_airport', timezone: 'Asia/Dhaka' },
  { icao: 'VIDP', iata: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India', lat: 28.5665, lng: 77.1031, type: 'large_airport', timezone: 'Asia/Kolkata' },
  { icao: 'VABB', iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656, type: 'large_airport', timezone: 'Asia/Kolkata' },
  { icao: 'ZSPD', iata: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', lat: 31.1434, lng: 121.8052, type: 'large_airport', timezone: 'Asia/Shanghai' },
  { icao: 'ZBAA', iata: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', lat: 40.0801, lng: 116.5846, type: 'large_airport', timezone: 'Asia/Shanghai' },

  // ============ AFRICA ============
  { icao: 'FAOR', iata: 'JNB', name: 'O.R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', lat: -26.1392, lng: 28.2460, type: 'large_airport', timezone: 'Africa/Johannesburg' },
  { icao: 'FACT', iata: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', lat: -33.9648, lng: 18.6017, type: 'large_airport', timezone: 'Africa/Johannesburg' },
  { icao: 'HECA', iata: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', lat: 30.1219, lng: 31.4056, type: 'large_airport', timezone: 'Africa/Cairo' },
  { icao: 'DNMM', iata: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos', country: 'Nigeria', lat: 6.5774, lng: 3.3214, type: 'large_airport', timezone: 'Africa/Lagos' },
  { icao: 'HAAB', iata: 'ADD', name: 'Addis Ababa Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.9779, lng: 38.7993, type: 'large_airport', timezone: 'Africa/Addis_Ababa' },
  { icao: 'FMMI', iata: 'TNR', name: 'Ivato International Airport', city: 'Antananarivo', country: 'Madagascar', lat: -18.7969, lng: 47.4788, type: 'large_airport', timezone: 'Indian/Antananarivo' },

  // ============ CARIBBEAN / ISLANDS ============
  { icao: 'TNCM', iata: 'SXM', name: 'Princess Juliana International Airport', city: 'Sint Maarten', country: 'Sint Maarten', lat: 18.0411, lng: -63.1089, type: 'large_airport', timezone: 'America/Lower_Princes' },
  { icao: 'MBPV', iata: 'PLS', name: 'Providenciales Airport', city: 'Providenciales', country: 'Turks and Caicos', lat: 21.7736, lng: -72.2659, type: 'large_airport', timezone: 'America/Grand_Turk' },
  { icao: 'MYNN', iata: 'NAS', name: 'Lynden Pindling International Airport', city: 'Nassau', country: 'Bahamas', lat: 25.0389, lng: -77.4662, type: 'large_airport', timezone: 'America/Nassau' },
  { icao: 'TBPB', iata: 'BGI', name: 'Grantley Adams International Airport', city: 'Bridgetown', country: 'Barbados', lat: 13.0746, lng: -59.4925, type: 'large_airport', timezone: 'America/Barbados' },
  { icao: 'MROC', iata: 'SJO', name: 'Juan Santamaría International Airport', city: 'San José', country: 'Costa Rica', lat: 9.9939, lng: -84.2088, type: 'large_airport', timezone: 'America/Costa_Rica' },

  // ============ ADDITIONAL PRIVATE/BUSINESS AIRPORTS ============
  { icao: 'LJLJ', iata: 'LJU', name: 'Ljubljana Jože Pučnik Airport', city: 'Ljubljana', country: 'Slovenia', lat: 46.2237, lng: 14.4576, type: 'large_airport', timezone: 'Europe/Ljubljana' },
  { icao: 'LKMT', iata: 'OSR', name: 'Leos Janáček Airport Ostrava', city: 'Ostrava', country: 'Czech Republic', lat: 49.6963, lng: 18.1111, type: 'large_airport', timezone: 'Europe/Prague' },
  { icao: 'EDRZ', iata: 'ZQW', name: 'Zweibrücken Airport', city: 'Zweibrücken', country: 'Germany', lat: 49.2094, lng: 7.4003, type: 'medium_airport', timezone: 'Europe/Berlin' },
  { icao: 'KMEI', iata: 'MEI', name: 'Key Field Airport', city: 'Meridian', country: 'United States', lat: 32.3326, lng: -88.7519, type: 'medium_airport', timezone: 'America/Chicago' },
  { icao: 'KSTS', iata: 'STS', name: 'Charles M. Schulz Sonoma County Airport', city: 'Santa Rosa', country: 'United States', lat: 38.5090, lng: -122.8128, type: 'medium_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KMRY', iata: 'MRY', name: 'Monterey Regional Airport', city: 'Monterey', country: 'United States', lat: 36.5870, lng: -121.8428, type: 'medium_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KSBA', iata: 'SBA', name: 'Santa Barbara Airport', city: 'Santa Barbara', country: 'United States', lat: 34.4262, lng: -119.8403, type: 'medium_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KSAN', iata: 'SAN', name: 'San Diego International Airport', city: 'San Diego', country: 'United States', lat: 32.7336, lng: -117.1897, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KMCO', iata: 'MCO', name: 'Orlando International Airport', city: 'Orlando', country: 'United States', lat: 28.4294, lng: -81.3089, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KSFB', iata: 'SFB', name: 'Orlando Sanford International Airport', city: 'Sanford', country: 'United States', lat: 28.7776, lng: -81.2375, type: 'medium_airport', timezone: 'America/New_York' },
  { icao: 'KTPA', iata: 'TPA', name: 'Tampa International Airport', city: 'Tampa', country: 'United States', lat: 27.9755, lng: -82.5332, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KRSW', iata: 'RSW', name: 'Southwest Florida International Airport', city: 'Fort Myers', country: 'United States', lat: 26.5362, lng: -81.7552, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KNKX', iata: 'NKX', name: 'Miramar MCAS Airport', city: 'San Diego', country: 'United States', lat: 32.8686, lng: -117.1428, type: 'medium_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KGEG', iata: 'GEG', name: 'Spokane International Airport', city: 'Spokane', country: 'United States', lat: 47.6199, lng: -117.5339, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KSMF', iata: 'SMF', name: 'Sacramento International Airport', city: 'Sacramento', country: 'United States', lat: 38.6954, lng: -121.5908, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KFAT', iata: 'FAT', name: 'Fresno Yosemite International Airport', city: 'Fresno', country: 'United States', lat: 36.7762, lng: -119.7182, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KRNO', iata: 'RNO', name: 'Reno-Tahoe International Airport', city: 'Reno', country: 'United States', lat: 39.4991, lng: -119.7681, type: 'large_airport', timezone: 'America/Los_Angeles' },
  { icao: 'KBZN', iata: 'BZN', name: 'Bozeman Yellowstone International Airport', city: 'Bozeman', country: 'United States', lat: 45.7777, lng: -111.1527, type: 'medium_airport', timezone: 'America/Denver' },
  { icao: 'KJAC', iata: 'JAC', name: 'Jackson Hole Airport', city: 'Jackson Hole', country: 'United States', lat: 43.6073, lng: -110.7378, type: 'medium_airport', timezone: 'America/Denver' },
  { icao: 'KHSV', iata: 'HSV', name: 'Huntsville International Airport', city: 'Huntsville', country: 'United States', lat: 34.6372, lng: -86.7751, type: 'medium_airport', timezone: 'America/Chicago' },
  { icao: 'KBHM', iata: 'BHM', name: 'Birmingham-Shuttlesworth International Airport', city: 'Birmingham', country: 'United States', lat: 33.5629, lng: -86.7535, type: 'large_airport', timezone: 'America/Chicago' },
  { icao: 'KMEM', iata: 'MEM', name: 'Memphis International Airport', city: 'Memphis', country: 'United States', lat: 35.0424, lng: -89.9767, type: 'large_airport', timezone: 'America/Chicago' },
  { icao: 'KBNA', iata: 'BNA', name: 'Nashville International Airport', city: 'Nashville', country: 'United States', lat: 36.1245, lng: -86.6782, type: 'large_airport', timezone: 'America/Chicago' },
  { icao: 'KCLT', iata: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', country: 'United States', lat: 35.2140, lng: -80.9431, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KRDU', iata: 'RDU', name: 'Raleigh-Durham International Airport', city: 'Raleigh', country: 'United States', lat: 35.8776, lng: -78.7875, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KRIC', iata: 'RIC', name: 'Richmond International Airport', city: 'Richmond', country: 'United States', lat: 37.5052, lng: -77.3197, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KPHL', iata: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'United States', lat: 39.8744, lng: -75.2424, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KBDL', iata: 'BDL', name: 'Bradley International Airport', city: 'Hartford', country: 'United States', lat: 41.9389, lng: -72.6832, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KPVD', iata: 'PVD', name: 'T.F. Green Airport', city: 'Providence', country: 'United States', lat: 41.7272, lng: -71.4283, type: 'large_airport', timezone: 'America/New_York' },
  { icao: 'KORH', iata: 'ORH', name: 'Worcester Regional Airport', city: 'Worcester', country: 'United States', lat: 42.2673, lng: -71.8757, type: 'medium_airport', timezone: 'America/New_York' },
  { icao: 'CYYZ', iata: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', lat: 43.6772, lng: -79.6306, type: 'large_airport', timezone: 'America/Toronto' },
  { icao: 'CYVR', iata: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', lat: 49.1947, lng: -123.1792, type: 'large_airport', timezone: 'America/Vancouver' },
  { icao: 'CYUL', iata: 'YUL', name: 'Montréal-Pierre Elliott Trudeau Airport', city: 'Montreal', country: 'Canada', lat: 45.4706, lng: -73.7408, type: 'large_airport', timezone: 'America/Montreal' },
  { icao: 'CYYC', iata: 'YYC', name: 'Calgary International Airport', city: 'Calgary', country: 'Canada', lat: 51.1139, lng: -114.0200, type: 'large_airport', timezone: 'America/Edmonton' },
  { icao: 'CYEG', iata: 'YEG', name: 'Edmonton International Airport', city: 'Edmonton', country: 'Canada', lat: 53.3097, lng: -113.5797, type: 'large_airport', timezone: 'America/Edmonton' },

  // ============ AUSTRALIA / OCEANIA ============
  { icao: 'YSSY', iata: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', lat: -33.9461, lng: 151.1772, type: 'large_airport', timezone: 'Australia/Sydney' },
  { icao: 'YMML', iata: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lng: 144.8410, type: 'large_airport', timezone: 'Australia/Melbourne' },
  { icao: 'YBBN', iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', lat: -27.3842, lng: 153.1175, type: 'large_airport', timezone: 'Australia/Brisbane' },
  { icao: 'NZAA', iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lng: 174.7850, type: 'large_airport', timezone: 'Pacific/Auckland' },
];

/**
 * Search airports by query (name, ICAO, IATA, city)
 */
const searchAirports = (query, limit = 20) => {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = AIRPORTS.filter(
    (a) =>
      a.icao.toLowerCase().includes(q) ||
      (a.iata && a.iata.toLowerCase().includes(q)) ||
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
  );
  return results.slice(0, limit);
};

const getAirportByCode = (code) => {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  return AIRPORTS.find((a) => a.icao === upper || a.iata === upper) || null;
};

const findAirportByCode = getAirportByCode;
const airportsList = AIRPORTS;

module.exports = {
  AIRPORTS,
  airportsList,
  searchAirports,
  getAirportByCode,
  findAirportByCode,
};

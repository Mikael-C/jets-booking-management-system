/**
 * Fleet Image Catalog for Orbelo Private Jet Fleet
 * Curated high-resolution royalty-free imagery from Unsplash and CDNs.
 * All exterior shots selected with clean fuselages and NO visible tail numbers.
 * Includes complete photo sets:
 * - Exterior (in-flight, tarmac, ramp, sunrise/sunset, hangar)
 * - Interior / Cabin (executive club seating, mood lighting, conference tables, divans)
 * - Bathroom / Lavatory (marble vanity, illuminated mirrors, private enclosed lavatories)
 * - Cockpit (Garmin / Collins glass cockpits)
 * - Galley & Bar (refreshment centers, espresso machines, champagne service)
 */

const TURBOPROP_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1519074069444-1ba4fff16def?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1529154036614-a60975f5c760?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1600&auto=format&fit=crop&q=85',
  ],
  bathrooms: [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1583073030863-74450d26bd5b?w=1600&auto=format&fit=crop&q=85',
  ],
};

const PISTON_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1520645521318-f03a712f0e67?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1529154036614-a60975f5c760?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=85',
  ],
};

const ENTRY_LEVEL_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1579208030886-b937da0925dc?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1612099747073-66178d1c1d33?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1529154036614-a60975f5c760?w=1600&auto=format&fit=crop&q=85',
  ],
  bathrooms: [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=85',
  ],
};

const LIGHT_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1612099747073-66178d1c1d33?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1579208030886-b937da0925dc?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1600&auto=format&fit=crop&q=85',
  ],
  bathrooms: [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1583073030863-74450d26bd5b?w=1600&auto=format&fit=crop&q=85',
  ],
};

const SUPER_LIGHT_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1520437358207-323b43b50729?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1619267258424-4e49aaaf4b4b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1600&auto=format&fit=crop&q=85',
  ],
  bathrooms: [
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=85',
  ],
};

const MIDSIZE_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1579208030886-b937da0925dc?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1612099747073-66178d1c1d33?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1619267258424-4e49aaaf4b4b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=1600&auto=format&fit=crop&q=85',
  ],
  bathrooms: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1600&auto=format&fit=crop&q=85',
  ],
  galleys: [
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1583073030863-74450d26bd5b?w=1600&auto=format&fit=crop&q=85',
  ],
};

const SUPER_MIDSIZE_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1612099747073-66178d1c1d33?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1619267258424-4e49aaaf4b4b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1600&auto=format&fit=crop&q=85',
  ],
  bathrooms: [
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85',
  ],
  galleys: [
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=85',
  ],
};

const HEAVY_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1619267258424-4e49aaaf4b4b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1600&auto=format&fit=crop&q=85',
  ],
  bathrooms: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&auto=format&fit=crop&q=85',
  ],
  galleys: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1583073030863-74450d26bd5b?w=1600&auto=format&fit=crop&q=85',
  ],
};

const ULTRA_LONG_RANGE_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1612099747073-66178d1c1d33?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1619267258424-4e49aaaf4b4b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1600&auto=format&fit=crop&q=85',
  ],
  bathrooms: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&auto=format&fit=crop&q=85',
  ],
  galleys: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=85',
  ],
};

const VIP_AIRLINER_IMAGES = {
  exteriors: [
    'https://images.unsplash.com/photo-1589710751893-f9a6770ad71b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=1600&auto=format&fit=crop&q=85',
  ],
  cabins: [
    'https://images.unsplash.com/photo-1619267258424-4e49aaaf4b4b?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1600&auto=format&fit=crop&q=85',
  ],
  bathrooms: [
    'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=1600&auto=format&fit=crop&q=85',
  ],
  galleys: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=85',
  ],
  cockpits: [
    'https://images.unsplash.com/photo-1583073030863-74450d26bd5b?w=1600&auto=format&fit=crop&q=85',
  ],
};

const CATEGORY_IMAGE_MAP = {
  turboprop: TURBOPROP_IMAGES,
  piston: PISTON_IMAGES,
  'entry-level': ENTRY_LEVEL_IMAGES,
  light: LIGHT_IMAGES,
  'super-light': SUPER_LIGHT_IMAGES,
  midsize: MIDSIZE_IMAGES,
  'super-midsize': SUPER_MIDSIZE_IMAGES,
  heavy: HEAVY_IMAGES,
  'ultra-long-range': ULTRA_LONG_RANGE_IMAGES,
  'vip-airliner': VIP_AIRLINER_IMAGES,
};

/**
 * Generate full image collection for an aircraft based on category, index, and amenities
 */
function buildAircraftImages(category, index, name, options = {}) {
  const catalog = CATEGORY_IMAGE_MAP[category] || MIDSIZE_IMAGES;
  const extList = catalog.exteriors || [];
  const cabList = catalog.cabins || [];
  const bathList = catalog.bathrooms || [];
  const cockList = catalog.cockpits || [];
  const gallList = catalog.galleys || [];

  const extUrl = extList[index % extList.length];
  const cabUrl = cabList[index % cabList.length];

  const images = [
    {
      url: extUrl,
      thumb: extUrl.replace('w=1600', 'w=400'),
      alt: `${name} clean exterior ramp view`,
      type: 'exterior',
      source: 'unsplash',
      credit: 'Private Aviation Collection',
      creditUrl: 'https://unsplash.com',
    },
    {
      url: cabUrl,
      thumb: cabUrl.replace('w=1600', 'w=400'),
      alt: `${name} luxury executive cabin interior`,
      type: 'interior',
      source: 'unsplash',
      credit: 'Private Aviation Collection',
      creditUrl: 'https://unsplash.com',
    },
  ];

  // Add bathroom/toilet if applicable (jets, VIP, or turboprops with enclosed lav)
  if (options.hasToilette && bathList.length > 0) {
    const bathUrl = bathList[index % bathList.length];
    images.push({
      url: bathUrl,
      thumb: bathUrl.replace('w=1600', 'w=400'),
      alt: `${name} enclosed private lavatory and vanity sink`,
      type: 'bathroom',
      source: 'unsplash',
      credit: 'Private Aviation Collection',
      creditUrl: 'https://unsplash.com',
    });
  }

  // Add galley if available
  if (gallList.length > 0 && options.hasGalley) {
    const gallUrl = gallList[index % gallList.length];
    images.push({
      url: gallUrl,
      thumb: gallUrl.replace('w=1600', 'w=400'),
      alt: `${name} executive galley refreshment center`,
      type: 'galley',
      source: 'unsplash',
      credit: 'Private Aviation Collection',
      creditUrl: 'https://unsplash.com',
    });
  }

  // Add cockpit avionics
  if (cockList.length > 0) {
    const cockUrl = cockList[index % cockList.length];
    images.push({
      url: cockUrl,
      thumb: cockUrl.replace('w=1600', 'w=400'),
      alt: `${name} flight deck glass cockpit avionics`,
      type: 'cockpit',
      source: 'unsplash',
      credit: 'Private Aviation Collection',
      creditUrl: 'https://unsplash.com',
    });
  }

  return {
    imageExterior: extUrl,
    imageInterior: cabUrl,
    images,
    additionalImages: images.slice(1).map(i => i.url),
  };
}

module.exports = {
  CATEGORY_IMAGE_MAP,
  buildAircraftImages,
};

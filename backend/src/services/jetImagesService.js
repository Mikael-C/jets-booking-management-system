const axios = require('axios');
const logger = require('../middleware/logger');

// Fallback jet images for when APIs are unavailable
const FALLBACK_JET_IMAGES = {
  exterior: [
    { url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200', thumb: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400', description: 'Private jet on tarmac at sunset', source: 'unsplash', credit: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1200', thumb: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=400', description: 'Luxury private jet exterior', source: 'unsplash', credit: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1612099747073-66178d1c1d33?w=1200', thumb: 'https://images.unsplash.com/photo-1612099747073-66178d1c1d33?w=400', description: 'Business jet at airport', source: 'unsplash', credit: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?w=1200', thumb: 'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?w=400', description: 'White private aircraft on runway', source: 'unsplash', credit: 'Unsplash' },
  ],
  interior: [
    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Luxury jet cabin interior', source: 'unsplash', credit: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200', thumb: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400', description: 'Private jet lounge seating', source: 'unsplash', credit: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1529154036614-a60975f5c760?w=1200', thumb: 'https://images.unsplash.com/photo-1529154036614-a60975f5c760?w=400', description: 'Aircraft cabin with leather seats', source: 'unsplash', credit: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1619267258424-4e49aaaf4b4b?w=1200', thumb: 'https://images.unsplash.com/photo-1619267258424-4e49aaaf4b4b?w=400', description: 'Ultra luxury jet interior', source: 'unsplash', credit: 'Unsplash' },
  ],
};

const imageCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const transformUnsplashImage = (img) => ({
  url: img.urls?.regular || img.urls?.full,
  thumb: img.urls?.thumb || img.urls?.small,
  description: img.description || img.alt_description || 'Private jet',
  source: 'unsplash',
  credit: img.user?.name ? `Photo by ${img.user.name} on Unsplash` : 'Unsplash',
  creditUrl: img.links?.html,
  width: img.width,
  height: img.height,
  color: img.color,
});

const transformPexelsImage = (img) => ({
  url: img.src?.large2x || img.src?.large,
  thumb: img.src?.tiny || img.src?.small,
  description: img.alt || 'Private jet',
  source: 'pexels',
  credit: `Photo by ${img.photographer} on Pexels`,
  creditUrl: img.url,
  width: img.width,
  height: img.height,
  color: img.avg_color,
});

const searchUnsplash = async (query, perPage = 10) => {
  if (!process.env.UNSPLASH_ACCESS_KEY) return null;

  const cacheKey = `unsplash:${query}:${perPage}`;
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
      params: { query, per_page: perPage, orientation: 'landscape' },
      timeout: 8000,
    });
    const images = (response.data.results || []).map(transformUnsplashImage);
    imageCache.set(cacheKey, { data: images, timestamp: Date.now() });
    return images;
  } catch (error) {
    logger.warn(`Unsplash API error: ${error.message}`);
    return null;
  }
};

const searchPexels = async (query, perPage = 10) => {
  if (!process.env.PEXELS_API_KEY) return null;

  const cacheKey = `pexels:${query}:${perPage}`;
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      params: { query, per_page: perPage, orientation: 'landscape' },
      timeout: 8000,
    });
    const images = (response.data.photos || []).map(transformPexelsImage);
    imageCache.set(cacheKey, { data: images, timestamp: Date.now() });
    return images;
  } catch (error) {
    logger.warn(`Pexels API error: ${error.message}`);
    return null;
  }
};

/**
 * Search jet images — tries Unsplash first, falls back to Pexels, then static fallbacks
 */
const searchJetImages = async (query, options = {}) => {
  const { perPage = 10, type = 'all' } = options;

  // Try Unsplash first
  let images = await searchUnsplash(`${query} private jet aviation`, perPage);

  // Fallback to Pexels
  if (!images || images.length === 0) {
    images = await searchPexels(`${query} private jet`, perPage);
  }

  // Fallback to static images
  if (!images || images.length === 0) {
    if (type === 'interior') return FALLBACK_JET_IMAGES.interior;
    if (type === 'exterior') return FALLBACK_JET_IMAGES.exterior;
    return [...FALLBACK_JET_IMAGES.exterior, ...FALLBACK_JET_IMAGES.interior];
  }

  return images;
};

/**
 * Get images for a specific aircraft model
 */
const getAircraftImages = async (aircraftModel) => {
  const query = `${aircraftModel} aircraft jet`;
  return searchJetImages(query, { perPage: 8 });
};

/**
 * Get interior jet photos
 */
const getInteriorImages = async (query = '') => {
  const searchQuery = query ? `${query} interior cabin` : 'private jet interior luxury cabin';
  const images = await searchJetImages(searchQuery, { perPage: 12, type: 'interior' });
  if (!images || images.length === 0) return FALLBACK_JET_IMAGES.interior;
  return images;
};

/**
 * Get exterior jet photos
 */
const getExteriorImages = async (query = '') => {
  const searchQuery = query ? `${query} exterior tarmac` : 'private jet exterior luxury aviation';
  const images = await searchJetImages(searchQuery, { perPage: 12, type: 'exterior' });
  if (!images || images.length === 0) return FALLBACK_JET_IMAGES.exterior;
  return images;
};

/**
 * Upload aircraft image to Cloudinary
 */
const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    const cloudinaryConfig = require('../config/cloudinary');
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return { success: false, message: 'Cloudinary not configured' };
    }
    const result = await cloudinaryConfig.uploadBuffer(fileBuffer, {
      folder: 'orbelo/aircraft',
      ...options,
    });
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  searchJetImages,
  searchImages: searchJetImages,
  getAircraftImages,
  getJetImages: getAircraftImages,
  getInteriorImages,
  getExteriorImages,
  uploadToCloudinary,
  FALLBACK_JET_IMAGES,
};

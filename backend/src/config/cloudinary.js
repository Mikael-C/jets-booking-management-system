const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const cloudinaryConfig = {
  instance: cloudinary,
  folders: {
    aircraft: 'orbelo/aircraft',
    documents: 'orbelo/documents',
    avatars: 'orbelo/avatars',
  },

  uploadOptions: {
    aircraft: {
      folder: 'orbelo/aircraft',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      max_bytes: 10 * 1024 * 1024, // 10MB
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  },

  uploadBuffer: async (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'orbelo/aircraft', ...options },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
  },
};

module.exports = cloudinaryConfig;

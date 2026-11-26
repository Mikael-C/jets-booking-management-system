const jwt = require('jsonwebtoken');

const jwtConfig = {
  accessTokenSecret: process.env.JWT_SECRET || 'orbelo-access-secret-change-in-production',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'orbelo-refresh-secret-change-in-production',
  // A working session lasts 12 hours on one token; the app renews it on its own with the refresh token
  // (30 days), so people are not signed out while they work. Both can be set on the server.
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '12h',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',

  signAccessToken: (payload) => {
    return jwt.sign(payload, jwtConfig.accessTokenSecret, {
      expiresIn: jwtConfig.accessTokenExpiry,
      issuer: 'orbelo.com',
      audience: 'orbelo-app',
    });
  },

  signRefreshToken: (payload) => {
    return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
      expiresIn: jwtConfig.refreshTokenExpiry,
      issuer: 'orbelo.com',
      audience: 'orbelo-app',
    });
  },

  verifyAccessToken: (token) => {
    return jwt.verify(token, jwtConfig.accessTokenSecret, {
      issuer: 'orbelo.com',
      audience: 'orbelo-app',
      clockTolerance: 60, // a minute of clock difference between servers is not an expiry
    });
  },

  verifyRefreshToken: (token) => {
    return jwt.verify(token, jwtConfig.refreshTokenSecret, {
      issuer: 'orbelo.com',
      audience: 'orbelo-app',
      clockTolerance: 60,
    });
  },
};

module.exports = jwtConfig;

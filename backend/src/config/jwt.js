const jwt = require('jsonwebtoken');

const jwtConfig = {
  accessTokenSecret: process.env.JWT_SECRET || 'orbelo-access-secret-change-in-production',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'orbelo-refresh-secret-change-in-production',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',

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
    });
  },

  verifyRefreshToken: (token) => {
    return jwt.verify(token, jwtConfig.refreshTokenSecret, {
      issuer: 'orbelo.com',
      audience: 'orbelo-app',
    });
  },
};

module.exports = jwtConfig;

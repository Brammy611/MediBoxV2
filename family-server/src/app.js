const express = require('express');
const cors = require('cors');
const familyRoutes = require('./routes/familyRoutes');

const buildCorsOptions = () => {
  const raw = process.env.FAMILY_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS || '';
  const origins = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return {};
  }

  return {
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        return callback(null, origin);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  };
};

const registerRoutes = (app) => {
  app.use('/api/family', familyRoutes);
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'family' });
  });
};

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(buildCorsOptions()));

  registerRoutes(app);

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      message: err.message || 'Unexpected error',
      status,
    });
  });

  return app;
};

module.exports = { createApp };

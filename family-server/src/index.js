const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createApp } = require('./app');
const { connectDatabase } = require('./config/database');

const loadEnvironment = () => {
  const localEnvPath = path.resolve(__dirname, '../.env');
  const sharedEnvPath = path.resolve(__dirname, '../../server/.env');

  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
    return;
  }

  if (fs.existsSync(sharedEnvPath)) {
    dotenv.config({ path: sharedEnvPath });
    return;
  }

  dotenv.config();
};

loadEnvironment();

const port = Number(process.env.PORT || process.env.FAMILY_SERVICE_PORT || 5050);
const mongoUri = process.env.MONGO_URI;

const start = async () => {
  try {
    await connectDatabase(mongoUri);
    // eslint-disable-next-line no-console
    console.log('✅ Connected to MongoDB');

    const app = createApp();
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Family service listening on port ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start family service', error);
    process.exit(1);
  }
};

start();

const mongoose = require('mongoose');

const connectDatabase = async (uri) => {
  if (!uri) {
    throw new Error('Mongo URI is required');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
};

module.exports = {
  connectDatabase,
};

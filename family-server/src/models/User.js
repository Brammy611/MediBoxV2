const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    name: { type: String, trim: true },
    role: {
      type: String,
      enum: ['user', 'family', 'pharmacist', 'admin'],
      default: 'user',
      index: true,
    },
    relationship: { type: String, trim: true },
    medicalHistory: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

module.exports = mongoose.model('User', UserSchema);

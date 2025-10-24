const mongoose = require('mongoose');

const { Schema } = mongoose;

const FamilyAlertSchema = new Schema(
  {
    family: { type: Schema.Types.ObjectId, ref: 'FamilyAccount', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true },
    message: { type: String, trim: true },
  details: { type: String, trim: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning',
    },
    source: {
      type: String,
      enum: ['adherence', 'box', 'manual'],
      default: 'adherence',
    },
    acknowledgedAt: { type: Date },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'family_alerts',
  }
);

module.exports = mongoose.model('FamilyAlert', FamilyAlertSchema);

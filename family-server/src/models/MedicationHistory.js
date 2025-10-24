const mongoose = require('mongoose');

const { Schema } = mongoose;

const MedicationHistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, trim: true },
    familyNotes: { type: String, trim: true },
    medicineName: { type: String, trim: true },
    dosage: { type: String, trim: true },
    status: {
      type: String,
      enum: ['taken', 'missed', 'delayed', 'skipped', 'unknown'],
      default: 'unknown',
      index: true,
    },
    scheduledTime: { type: Date },
    takenTime: { type: Date },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'medication_history',
  }
);

module.exports = mongoose.model('MedicationHistory', MedicationHistorySchema);

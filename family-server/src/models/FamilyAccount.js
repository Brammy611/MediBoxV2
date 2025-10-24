const mongoose = require('mongoose');

const { Schema } = mongoose;

const MonitoredUserSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    relationship: { type: String, trim: true },
    notes: { type: String, trim: true },
    medications: {
      type: [
        new Schema(
          {
            name: { type: String, trim: true },
            schedule: { type: String, trim: true },
            dosage: { type: String, trim: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { _id: false }
);

const FamilyAccountSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    relationship: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    notificationChannel: {
      type: String,
      enum: ['email', 'sms', 'push'],
      default: 'email',
    },
    monitoredUsers: { type: [MonitoredUserSchema], default: [] },
    lastAcknowledgedAlert: { type: Date },
    alertCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'family_accounts',
  }
);

module.exports = mongoose.model('FamilyAccount', FamilyAccountSchema);

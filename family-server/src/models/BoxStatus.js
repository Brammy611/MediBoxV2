const mongoose = require('mongoose');

const { Schema } = mongoose;

const BoxStatusSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    humidity: { type: Number },
    temperature: { type: Number },
    lightDuration: { type: Number },
    motion: { type: Number, enum: [0, 1], default: 0 },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  {
    collection: 'box_status',
  }
);

module.exports = mongoose.model('BoxStatus', BoxStatusSchema);

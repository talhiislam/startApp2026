const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['bug', 'booking', 'campsite', 'account', 'other'], required: true },
  message:  { type: String, required: true, trim: true },
  status:   { type: String, enum: ['open', 'resolved'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.models.SupportRequest || mongoose.model('SupportRequest', SupportRequestSchema);

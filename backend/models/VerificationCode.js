const mongoose = require('mongoose');

const VerificationCodeSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  code:      { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Auto-delete expired codes
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.VerificationCode || mongoose.model('VerificationCode', VerificationCodeSchema);

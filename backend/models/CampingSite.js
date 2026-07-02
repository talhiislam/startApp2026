const mongoose = require('mongoose');

const CampingSiteSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, required: true },
  wilaya:        { type: String, required: true },
  region:        { type: String, enum: ['sahara', 'kabylie', 'hoggar', 'coastal', 'other'], required: true },
  coordinates:   { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  images:        [{ type: String }],
  pricePerNight: { type: Number, required: true },
  amenities:     [{ type: String }],
  type:          { type: String, enum: ['tent', 'bungalow', 'wild', 'glamping'], required: true },
  owner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  capacity:      { type: Number, default: 10 },
  isApproved:    { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
  reviewCount:   { type: Number, default: 0 },
}, { timestamps: true });

// Text index for basic search (fallback when Atlas Search not available)
CampingSiteSchema.index({ name: 'text', description: 'text', wilaya: 'text', amenities: 'text' });

module.exports = mongoose.models.CampingSite || mongoose.model('CampingSite', CampingSiteSchema);

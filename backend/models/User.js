const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  username:         { type: String, required: true, trim: true },
  password:         { type: String },
  role:             { type: String, enum: ['camper', 'owner', 'admin'], default: 'camper' },
  phone:            { type: String, default: '' },
  fullName:         { type: String, default: '' },
  city:             { type: String, default: '' },
  dateOfBirth:      { type: Date },
  avatar:           { type: String, default: '' },
  savedSites:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'CampingSite' }],
  notes:            { type: String, default: '' },
  isVerified:       { type: Boolean, default: false },
  mobileToken:      { type: String },
  mobileTokenExpiry:{ type: Date },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);

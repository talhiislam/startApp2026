const express = require('express');
const router = express.Router();
const CampingSite = require('../models/CampingSite');
const Booking = require('../models/Booking');
const { protect, ownerOnly } = require('../middleware/auth');
const { uploadCampsiteImages } = require('../config/cloudinary');

// GET /api/dashboard/campsites  — owner's own campsites
router.get('/campsites', protect, ownerOnly, async (req, res) => {
  try {
    const sites = await CampingSite.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: sites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboard/campsites  — create campsite
router.post('/campsites', protect, ownerOnly, uploadCampsiteImages.array('images', 10), async (req, res) => {
  try {
    const { name, description, wilaya, region, lat, lng, pricePerNight, amenities, type, capacity } = req.body;

    if (!name || !description || !wilaya || !region || !lat || !lng || !pricePerNight || !type)
      return res.status(400).json({ error: 'Missing required fields' });

    const images = req.files ? req.files.map(f => f.path) : [];

    const site = await CampingSite.create({
      name, description, wilaya, region,
      coordinates: { lat: Number(lat), lng: Number(lng) },
      images,
      pricePerNight: Number(pricePerNight),
      amenities: amenities ? (Array.isArray(amenities) ? amenities : amenities.split(',').map(a => a.trim())) : [],
      type,
      capacity: Number(capacity) || 10,
      owner: req.user._id,
      isApproved: false,
    });

    res.status(201).json({ success: true, data: site });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/campsites/:id
router.put('/campsites/:id', protect, ownerOnly, uploadCampsiteImages.array('images', 10), async (req, res) => {
  try {
    const site = await CampingSite.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Campsite not found' });
    if (site.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    const { name, description, wilaya, region, lat, lng, pricePerNight, amenities, type, capacity } = req.body;
    if (name) site.name = name;
    if (description) site.description = description;
    if (wilaya) site.wilaya = wilaya;
    if (region) site.region = region;
    if (lat && lng) site.coordinates = { lat: Number(lat), lng: Number(lng) };
    if (pricePerNight) site.pricePerNight = Number(pricePerNight);
    if (amenities) site.amenities = Array.isArray(amenities) ? amenities : amenities.split(',').map(a => a.trim());
    if (type) site.type = type;
    if (capacity) site.capacity = Number(capacity);
    if (req.files?.length) site.images = req.files.map(f => f.path);

    await site.save();
    res.json({ success: true, data: site });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/dashboard/campsites/:id
router.delete('/campsites/:id', protect, ownerOnly, async (req, res) => {
  try {
    const site = await CampingSite.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Campsite not found' });
    if (site.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });
    await site.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/bookings  — bookings for owner's campsites
router.get('/bookings', protect, ownerOnly, async (req, res) => {
  try {
    const sites = await CampingSite.find({ owner: req.user._id }).select('_id');
    const siteIds = sites.map(s => s._id);

    const bookings = await Booking.find({ site: { $in: siteIds } })
      .populate('site', 'name wilaya images')
      .populate('user', 'username fullName email phone avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/dashboard/bookings/:id  — confirm or cancel booking
router.patch('/bookings/:id', protect, ownerOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('site');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.site.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    const { status } = req.body;
    if (!['confirmed', 'cancelled'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    booking.status = status;
    await booking.save();
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

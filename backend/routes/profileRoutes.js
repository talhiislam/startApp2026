const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Booking = require('../models/Booking');
const CampingSite = require('../models/CampingSite');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

// GET /api/profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -mobileToken -mobileTokenExpiry')
      .populate('savedSites', 'name wilaya images pricePerNight averageRating type');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile
router.put('/', protect, async (req, res) => {
  try {
    const { fullName, phone, city, dateOfBirth } = req.body;
    const update = {};
    if (fullName !== undefined) update.fullName = fullName;
    if (phone !== undefined) update.phone = phone;
    if (city !== undefined) update.city = city;
    if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true })
      .select('-password -mobileToken -mobileTokenExpiry');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile/password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'All fields are required' });

    const user = await User.findById(req.user._id);
    if (!user.password)
      return res.status(400).json({ error: 'No password set on this account' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile/avatar
router.put('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    ).select('-password -mobileToken -mobileTokenExpiry');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile/notes
router.put('/notes', protect, async (req, res) => {
  try {
    const { notes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, { notes }, { new: true }
    ).select('notes');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/become-owner
router.post('/become-owner', protect, async (req, res) => {
  try {
    if (req.user.role === 'owner')
      return res.status(400).json({ error: 'Already an owner' });
    const user = await User.findByIdAndUpdate(
      req.user._id, { role: 'owner' }, { new: true }
    ).select('-password -mobileToken -mobileTokenExpiry');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profile/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const [totalBookings, upcomingBookings, completedBookings, savedSitesCount] = await Promise.all([
      Booking.countDocuments({ user: req.user._id }),
      Booking.countDocuments({ user: req.user._id, status: { $in: ['pending', 'confirmed'] }, checkIn: { $gte: new Date() } }),
      Booking.countDocuments({ user: req.user._id, status: 'completed' }),
      User.findById(req.user._id).select('savedSites').then(u => u?.savedSites?.length ?? 0),
    ]);
    res.json({ success: true, data: { totalBookings, upcomingBookings, completedBookings, savedSitesCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profile/saved
router.get('/saved', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('savedSites', 'name wilaya images pricePerNight averageRating type region');
    res.json({ success: true, data: user.savedSites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/saved/:siteId  — toggle save
router.post('/saved/:siteId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const siteId = req.params.siteId;
    const isSaved = user.savedSites.some(id => id.toString() === siteId);

    if (isSaved) {
      user.savedSites = user.savedSites.filter(id => id.toString() !== siteId);
    } else {
      const site = await CampingSite.findById(siteId);
      if (!site) return res.status(404).json({ error: 'Campsite not found' });
      user.savedSites.push(siteId);
    }

    await user.save();
    res.json({ success: true, saved: !isSaved, count: user.savedSites.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profile/saved/:siteId
router.delete('/saved/:siteId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { savedSites: req.params.siteId },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CampingSite = require('../models/CampingSite');
const Booking = require('../models/Booking');
const SupportRequest = require('../models/SupportRequest');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalCampsites, pendingCampsites, totalBookings, openSupport] = await Promise.all([
      User.countDocuments(),
      CampingSite.countDocuments({ isApproved: true }),
      CampingSite.countDocuments({ isApproved: false }),
      Booking.countDocuments(),
      SupportRequest.countDocuments({ status: 'open' }),
    ]);
    res.json({ success: true, data: { totalUsers, totalCampsites, pendingCampsites, totalBookings, openSupport } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password -mobileToken -mobileTokenExpiry').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['camper', 'owner', 'admin'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    const user = await User.findByIdAndUpdate(
      req.params.id, { role }, { new: true }
    ).select('-password -mobileToken -mobileTokenExpiry');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ error: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/campsites  — all campsites (pending + approved)
router.get('/campsites', protect, adminOnly, async (req, res) => {
  try {
    const { approved } = req.query;
    const filter = {};
    if (approved === 'false') filter.isApproved = false;
    else if (approved === 'true') filter.isApproved = true;

    const sites = await CampingSite.find(filter)
      .populate('owner', 'username email fullName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: sites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/campsites/:id/approve
router.put('/campsites/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const site = await CampingSite.findByIdAndUpdate(
      req.params.id, { isApproved: true }, { new: true }
    ).populate('owner', 'username email');
    if (!site) return res.status(404).json({ error: 'Campsite not found' });
    res.json({ success: true, data: site });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/campsites/:id/reject
router.put('/campsites/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const site = await CampingSite.findByIdAndDelete(req.params.id);
    if (!site) return res.status(404).json({ error: 'Campsite not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/support
router.get('/support', protect, adminOnly, async (req, res) => {
  try {
    const requests = await SupportRequest.find()
      .populate('user', 'username email avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/support/:id
router.patch('/support/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'resolved'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    const req_ = await SupportRequest.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate('user', 'username email');
    if (!req_) return res.status(404).json({ error: 'Support request not found' });
    res.json({ success: true, data: req_ });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

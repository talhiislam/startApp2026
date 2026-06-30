const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const CampingSite = require('../models/CampingSite');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendNewBookingEmail } = require('../config/email');

// GET /api/bookings  — get current user's bookings
router.get('/', protect, async (req, res) => {
  try {
    const now = new Date();
    // Auto-expire pending bookings whose check-in has passed
    await Booking.updateMany(
      { user: req.user._id, status: 'pending', checkIn: { $lt: now } },
      { status: 'cancelled' }
    );
    // Auto-complete confirmed bookings whose check-out has passed
    await Booking.updateMany(
      { user: req.user._id, status: 'confirmed', checkOut: { $lt: now } },
      { status: 'completed' }
    );

    const bookings = await Booking.find({ user: req.user._id })
      .populate('site', 'name wilaya region images pricePerNight type')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings  — create booking
router.post('/', protect, async (req, res) => {
  try {
    const { siteId, checkIn, checkOut, guests } = req.body;

    if (!siteId || !checkIn || !checkOut || !guests)
      return res.status(400).json({ error: 'All fields are required' });

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate)
      return res.status(400).json({ error: 'Check-out must be after check-in' });

    if (checkInDate < new Date())
      return res.status(400).json({ error: 'Check-in date must be in the future' });

    const site = await CampingSite.findById(siteId);
    if (!site) return res.status(404).json({ error: 'Campsite not found' });
    if (!site.isApproved) return res.status(400).json({ error: 'Campsite is not available' });

    // Check capacity conflicts
    const overlapping = await Booking.find({
      site: siteId,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (overlapping.length > 0) {
      const guestsPerDay = {};
      for (const b of overlapping) {
        const cursor = new Date(b.checkIn);
        cursor.setHours(0, 0, 0, 0);
        const end = new Date(b.checkOut);
        end.setHours(0, 0, 0, 0);
        while (cursor < end) {
          const key = cursor.toISOString().slice(0, 10);
          guestsPerDay[key] = (guestsPerDay[key] ?? 0) + b.guests;
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      const cursor = new Date(checkInDate);
      cursor.setHours(0, 0, 0, 0);
      const reqEnd = new Date(checkOutDate);
      reqEnd.setHours(0, 0, 0, 0);
      while (cursor < reqEnd) {
        const key = cursor.toISOString().slice(0, 10);
        if ((guestsPerDay[key] ?? 0) + Number(guests) > site.capacity)
          return res.status(409).json({ error: 'Not enough capacity for the selected dates' });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // Check user doesn't have overlapping booking
    const userOverlap = await Booking.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });
    if (userOverlap)
      return res.status(409).json({ error: 'You already have an active booking overlapping these dates' });

    const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * site.pricePerNight;

    const booking = await Booking.create({
      user: req.user._id,
      site: siteId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: Number(guests),
      totalPrice,
    });

    // Send email to owner
    try {
      const owner = await User.findById(site.owner).select('email username');
      if (owner) {
        await sendNewBookingEmail(
          owner.email, owner.username,
          req.user.username, site.name,
          checkInDate.toLocaleDateString('en-GB'),
          checkOutDate.toLocaleDateString('en-GB'),
          guests, totalPrice,
        );
      }
    } catch (e) { console.error('Email error:', e.message); }

    const populated = await booking.populate('site', 'name wilaya region images pricePerNight type');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('site');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id  — cancel booking
router.patch('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    const { status } = req.body;
    if (!['cancelled'].includes(status) && req.user.role !== 'admin')
      return res.status(403).json({ error: 'You can only cancel bookings' });

    booking.status = status;
    await booking.save();
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

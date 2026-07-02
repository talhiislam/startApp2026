const express = require('express');
const router = express.Router();
const CampingSite = require('../models/CampingSite');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const { uploadCampsiteImages } = require('../config/cloudinary');

const PAGE_SIZE = 12;

// GET /api/campsites  — public listing with filters + search + pagination
router.get('/', async (req, res) => {
  try {
    const { region, wilaya, type, minPrice, maxPrice, search, sort = 'newest', page } = req.query;

    const skipPagination = page === 'all';
    const currentPage = skipPagination ? 1 : Math.max(1, parseInt(page ?? '1', 10));
    const skip = (currentPage - 1) * PAGE_SIZE;

    const filter = { isApproved: true };
    if (region) filter.region = region;
    if (wilaya) filter.wilaya = new RegExp(wilaya, 'i');
    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { wilaya: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { amenities: new RegExp(search, 'i') },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      rating: { averageRating: -1 },
      price_asc: { pricePerNight: 1 },
      price_desc: { pricePerNight: -1 },
    };
    const sortQuery = sortMap[sort] ?? sortMap.newest;

    if (skipPagination) {
      const campsites = await CampingSite.find(filter).sort(sortQuery);
      return res.json({ success: true, data: campsites, total: campsites.length, page: 1, totalPages: 1 });
    }

    const [campsites, total] = await Promise.all([
      CampingSite.find(filter).sort(sortQuery).skip(skip).limit(PAGE_SIZE),
      CampingSite.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: campsites,
      total,
      page: currentPage,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campsites/search/autocomplete
router.get('/search/autocomplete', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) return res.json([]);

    const regex = new RegExp(q, 'i');
    const sites = await CampingSite.find({
      isApproved: true,
      $or: [{ name: regex }, { wilaya: regex }],
    }).select('name wilaya region').limit(8);

    const suggestions = sites.map(s => ({
      id: s._id,
      label: `${s.name} — ${s.wilaya}`,
      name: s.name,
      wilaya: s.wilaya,
    }));

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campsites/:id
router.get('/:id', async (req, res) => {
  try {
    const site = await CampingSite.findById(req.params.id).populate('owner', 'username fullName avatar');
    if (!site) return res.status(404).json({ error: 'Campsite not found' });
    if (!site.isApproved) return res.status(404).json({ error: 'Campsite not available' });
    res.json({ success: true, data: site });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campsites/:id/availability
router.get('/:id/availability', async (req, res) => {
  try {
    const { month, year } = req.query;
    const site = await CampingSite.findById(req.params.id).select('capacity');
    if (!site) return res.status(404).json({ error: 'Campsite not found' });

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0);

    const bookings = await Booking.find({
      site: req.params.id,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: endOfMonth },
      checkOut: { $gt: startOfMonth },
    });

    // Build occupancy map per day
    const occupancy = {};
    for (const b of bookings) {
      const cursor = new Date(b.checkIn);
      cursor.setHours(0, 0, 0, 0);
      const end = new Date(b.checkOut);
      end.setHours(0, 0, 0, 0);
      while (cursor < end) {
        const key = cursor.toISOString().slice(0, 10);
        occupancy[key] = (occupancy[key] ?? 0) + b.guests;
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // Mark days as unavailable where capacity is full
    const unavailable = Object.entries(occupancy)
      .filter(([, guests]) => guests >= site.capacity)
      .map(([date]) => date);

    res.json({ success: true, unavailableDates: unavailable, capacity: site.capacity, occupancy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campsites/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ targetId: req.params.id, targetType: 'CampingSite' })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campsites/:id/reviews
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    // Check user has completed booking for this site
    const hasBooking = await Booking.findOne({
      user: req.user._id,
      site: req.params.id,
      status: 'completed',
    });
    if (!hasBooking)
      return res.status(403).json({ error: 'You must have completed a booking to review this site' });

    // Prevent duplicate reviews
    const existing = await Review.findOne({ user: req.user._id, targetId: req.params.id });
    if (existing)
      return res.status(400).json({ error: 'You have already reviewed this campsite' });

    const review = await Review.create({
      user: req.user._id,
      targetId: req.params.id,
      targetType: 'CampingSite',
      rating: Number(rating),
      comment,
    });

    // Update campsite averageRating
    const allReviews = await Review.find({ targetId: req.params.id, targetType: 'CampingSite' });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await CampingSite.findByIdAndUpdate(req.params.id, {
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
    });

    const populated = await review.populate('user', 'username avatar');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/campsites/:id/reviews/:reviewId
router.delete('/:id/reviews/:reviewId', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    await review.deleteOne();

    const allReviews = await Review.find({ targetId: req.params.id, targetType: 'CampingSite' });
    const avg = allReviews.length
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : 0;
    await CampingSite.findByIdAndUpdate(req.params.id, {
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

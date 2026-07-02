const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const { protect } = require('../middleware/auth');

// GET /api/support  — current user's support requests
router.get('/', protect, async (req, res) => {
  try {
    const requests = await SupportRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/support
router.post('/', protect, async (req, res) => {
  try {
    const { category, message } = req.body;
    if (!category || !message)
      return res.status(400).json({ error: 'Category and message are required' });

    const request = await SupportRequest.create({
      user: req.user._id,
      category,
      message,
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

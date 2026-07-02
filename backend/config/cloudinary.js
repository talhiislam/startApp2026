const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for campsite images
const campsiteStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'camping/campsites', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});

// Storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'camping/avatars', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});

const uploadCampsiteImages = multer({ storage: campsiteStorage });
const uploadAvatar = multer({ storage: avatarStorage });

module.exports = { cloudinary, uploadCampsiteImages, uploadAvatar };

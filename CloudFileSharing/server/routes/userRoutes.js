const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadAvatar, changePassword, deleteAccount, getStorageStats } = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { avatarUpload, handleMulterError } = require('../middlewares/upload');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', avatarUpload.single('avatar'), handleMulterError, uploadAvatar);
router.post('/change-password', changePassword);
router.delete('/account', deleteAccount);
router.get('/storage-stats', getStorageStats);

module.exports = router;

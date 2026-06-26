const express = require('express');
const router = express.Router();
const {
  createShare, getShareByToken, downloadViaShare, getMyShares,
  getSharedWithMe, updateShare, deleteShare
} = require('../controllers/shareController');
const { protect, optionalAuth } = require('../middlewares/auth');

// Public routes (with optional auth)
router.get('/public/:token', optionalAuth, getShareByToken);
router.post('/public/:token', optionalAuth, getShareByToken); // POST for password submission
router.get('/public/:token/download', downloadViaShare);
router.post('/public/:token/download', downloadViaShare); // POST for password-protected downloads

// Protected routes
router.use(protect);
router.post('/', createShare);
router.get('/mine', getMyShares);
router.get('/shared-with-me', getSharedWithMe);
router.route('/:id').put(updateShare).delete(deleteShare);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getStats, getUsers, getUser, updateUser, deleteUser, getRecentActivity, getStorageAnalytics } = require('../controllers/adminController');
const { protect } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/admin');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/storage-analytics', getStorageAnalytics);
router.get('/activity', getRecentActivity);
router.route('/users').get(getUsers);
router.route('/users/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;

const express = require('express');
const router = express.Router();
const { createFolder, getFolders, getFolder, updateFolder, deleteFolder, getBreadcrumb, restoreFolder, permanentDeleteFolder } = require('../controllers/folderController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.route('/').get(getFolders).post(createFolder);
router.route('/:id').get(getFolder).put(updateFolder).delete(deleteFolder);
router.post('/:id/restore', restoreFolder);
router.delete('/:id/permanent', permanentDeleteFolder);
router.get('/:id/breadcrumb', getBreadcrumb);

module.exports = router;

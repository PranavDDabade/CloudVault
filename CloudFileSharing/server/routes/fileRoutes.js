const express = require('express');
const router = express.Router();
const {
  uploadFiles, getFiles, getFile, downloadFile, updateFile,
  deleteFile, restoreFile, permanentDelete, getTrash, toggleFavorite,
  duplicateFile, getRecentFiles, emptyTrash
} = require('../controllers/fileController');
const { protect } = require('../middlewares/auth');
const { upload, handleMulterError } = require('../middlewares/upload');

router.use(protect);

router.get('/recent', getRecentFiles);
router.get('/trash', getTrash);
router.delete('/trash/empty', emptyTrash);

router
  .route('/')
  .get(getFiles)
  .post(upload.array('files', 10), handleMulterError, uploadFiles);

router
  .route('/:id')
  .get(getFile)
  .put(updateFile)
  .delete(deleteFile);

router.get('/:id/download', downloadFile);
router.post('/:id/restore', restoreFile);
router.delete('/:id/permanent', permanentDelete);
router.post('/:id/favorite', toggleFavorite);
router.post('/:id/duplicate', duplicateFile);

module.exports = router;

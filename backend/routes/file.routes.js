const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { handleUpload, 
  getFiles, 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead } = require('../controllers/upload.controller');

const MAX_FILES_PER_REQUEST = Number(process.env.MAX_FILES_PER_REQUEST ?? 20);
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 10);

// Upload endpoint expected by the frontend (`POST /api/upload`)
router.post('/upload', upload.array('files', MAX_FILES_PER_REQUEST), handleUpload);
router.get('/upload/config', (req, res) => {
  res.status(200).json({
    maxFilesPerRequest: MAX_FILES_PER_REQUEST,
    maxFileSizeMb: MAX_FILE_SIZE_MB,
    acceptedMimeTypes: ['application/pdf'],
    fieldName: 'files',
  });
});
router.get('/files', getFiles);
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/read-all', markAllAsRead);
router.patch('/notifications/:id/read', markAsRead);
module.exports = router;

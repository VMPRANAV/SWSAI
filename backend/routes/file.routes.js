const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { handleUpload, 
  getFiles, 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead } = require('../controllers/upload.controller');

// Upload endpoint expected by the frontend (`POST /api/upload`)
router.post('/upload', upload.array('files',20), handleUpload);
router.get('/files', getFiles);
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/read-all', markAllAsRead);
router.patch('/notifications/:id/read', markAsRead);
module.exports = router;

const File = require('../models/File.model');
const Notification = require('../models/Notification.model');

// --- NEW: Added missing getFiles function ---
const getFiles = async (req, res) => {
  try {
    // Fetches all files, sorted by the most recent upload
    const files = await File.find().sort({ uploadDate: -1 });
    res.status(200).json(files);
  } catch (error) {
    console.error('Fetch Files Error:', error);
    res.status(500).json({ message: 'Failed to fetch files' });
  }
};

const handleUpload = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const isBulk = files.length > 3;

    const fileData = files.map(file => ({
      originalName: file.originalname, // Ensure this is stored for the UI table
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      status: 'complete'
    }));

    const savedFiles = await File.insertMany(fileData);

    if (isBulk) {
      const notificationMsg = `${files.length} files uploaded successfully.`;
      
      const newNotification = await Notification.create({
        message: notificationMsg,
        type: 'success',
        timestamp: new Date(),
        isRead: false
      });

      const io = req.app.get('socketio');
      if (io) {
        io.emit('bulk_upload_complete', {
          message: notificationMsg,
          notification: newNotification
        });
      }

      return res.status(202).json({
        message: 'Bulk upload initiated. Processing in background.',
        files: savedFiles
      });
    }

    return res.status(201).json({
      message: 'Files uploaded successfully.',
      files: savedFiles
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Internal Server Error during upload.' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timestamp: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get count' });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Update all failed' });
  }
};

module.exports = { 
  handleUpload, 
  getFiles, 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead 
};
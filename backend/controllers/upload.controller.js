const File = require('../models/File.model');
const Notification = require('../models/Notification.model');
const path = require('path');
const fs = require('fs/promises');

const bulkBatchState = new Map();

const getFiles = async (req, res) => {
  try {
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

    const batchId = typeof req.body?.batchId === 'string' && req.body.batchId.length > 0 ? req.body.batchId : null;
    const totalFiles = Number(req.body?.totalFiles ?? 0);
    const isBulk = totalFiles > 3;

    const fileData = files.map(file => ({
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: path.posix.join('uploads', file.filename),
      status: 'complete'
    }));

    const savedFiles = await File.insertMany(fileData);

    if (isBulk) {
      if (batchId) {
        const state = bulkBatchState.get(batchId) ?? { totalFiles: totalFiles || 0, receivedFiles: 0 };
        state.totalFiles = totalFiles || state.totalFiles;
        state.receivedFiles += files.length;
        bulkBatchState.set(batchId, state);

        if (state.totalFiles > 0 && state.receivedFiles >= state.totalFiles) {
          bulkBatchState.delete(batchId);
          const notificationMsg = `${state.totalFiles} files uploaded successfully.`;

          const newNotification = await Notification.create({
            message: notificationMsg,
            type: 'success',
            timestamp: new Date(),
            isRead: false,
            bulkCount: state.totalFiles,
          });

          const io = req.app.get('socketio');
          if (io) {
            io.emit('bulk_upload_complete', {
              message: notificationMsg,
              notification: newNotification,
            });
          }
        }
      }

      return res.status(202).json({ message: 'Bulk upload accepted.', files: savedFiles });
    }

    return res.status(201).json({
      message: 'Files uploaded successfully.',
      files: savedFiles
    });

  } catch (error) {
    console.error('Upload Error:', error);
    try {
      await Notification.create({
        message: 'Upload failed.',
        type: 'error',
        timestamp: new Date(),
        isRead: false,
      });
    } catch (_) {}
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
  deleteFile: async (req, res) => {
    try {
      const file = await File.findById(req.params.id);
      if (!file) return res.status(404).json({ message: 'File not found.' });

      const uploadsDir = path.resolve(__dirname, '..', 'uploads');
      const candidatePath = typeof file.path === 'string' ? file.path : '';
      const absolute = path.isAbsolute(candidatePath)
        ? path.resolve(candidatePath)
        : path.resolve(__dirname, '..', candidatePath);

      if (!(absolute === uploadsDir || absolute.startsWith(uploadsDir + path.sep))) {
        return res.status(400).json({ message: 'Invalid file path.' });
      }

      try {
        await fs.unlink(absolute);
      } catch {
      }

      await File.findByIdAndDelete(req.params.id);

      await Notification.create({
        message: `Deleted file: ${file.originalName}`,
        type: 'info',
        timestamp: new Date(),
        isRead: false,
      });

      return res.status(200).json({ message: 'File deleted.', deletedId: String(req.params.id) });
    } catch (error) {
      console.error('Delete File Error:', error);
      return res.status(500).json({ message: 'Failed to delete file.' });
    }
  },
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead 
};

const File = require('../models/File.model');
const Notification = require('../models/Notification.model');

const handleUpload = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const isBulk = files.length > 3;

    // 1. Map files to Database Objects
    const fileData = files.map(file => ({
      originalName: file.originalname,
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
      io.emit('bulk_upload_complete', {
        message: notificationMsg,
        notification: newNotification
      });

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

module.exports = { handleUpload };
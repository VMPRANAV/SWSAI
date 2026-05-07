require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const connectDB = require('./config/db');
const Notification = require('./models/Notification.model');
const fileRoutes = require('./routes/file.routes');


connectDB();

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const corsOptions = {
  origin: clientUrl,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

app.set('socketio', io);


app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));


app.use('/api', fileRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'File too large.',
      LIMIT_FILE_COUNT: 'Too many files in one request.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
    };
    Notification.create({
      message: messages[err.code] ?? err.message,
      type: 'error',
      timestamp: new Date(),
      isRead: false,
    }).catch(() => {});
    return res.status(400).json({ message: messages[err.code] ?? err.message, code: err.code });
  }
  if (err) {
    Notification.create({
      message: err.message ?? 'Internal Server Error',
      type: 'error',
      timestamp: new Date(),
      isRead: false,
    }).catch(() => {});
    return res.status(500).json({ message: err.message ?? 'Internal Server Error' });
  }
  next();
});

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

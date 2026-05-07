require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
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
app.use('/uploads', express.static('uploads'));


app.use('/api', fileRoutes);

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
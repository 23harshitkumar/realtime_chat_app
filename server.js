// Main Server File
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Socket.IO Room Permission System
const RoomRequest = require('./models/RoomRequest');
const Room = require('./models/Room');
const Message = require('./models/Message');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins room after approval
  socket.on('join-room', async (data) => {
    const { roomId, userId, username } = data;
    socket.join(roomId);
    
    // Notify others in room
    socket.to(roomId).emit('user-joined', {
      username,
      message: `${username} joined the room`
    });
  });

  // Request room access (FIX FOR YOUR ISSUE)
  socket.on('request-room-access', async (data) => {
    try {
      const { roomId, userId, username } = data;
      
      // Check if room exists
      const room = await Room.findById(roomId).populate('createdBy');
      if (!room) {
        socket.emit('room-error', { message: 'Room not found' });
        return;
      }

      // Check if already requested
      const existingRequest = await RoomRequest.findOne({
        roomId,
        userId,
        status: 'pending'
      });

      if (existingRequest) {
        socket.emit('room-error', { message: 'Request already pending' });
        return;
      }

      // Create new room request
      const roomRequest = new RoomRequest({
        roomId,
        userId,
        username,
        status: 'pending'
      });
      await roomRequest.save();

      // **THIS IS THE FIX** - Notify room host in real-time
      const hostSockets = await io.in(roomId).fetchSockets();
      hostSockets.forEach(hostSocket => {
        hostSocket.emit('room-request-notification', {
          requestId: roomRequest._id,
          roomId,
          userId,
          username,
          message: `${username} wants to join the room`,
          timestamp: new Date()
        });
      });

      // Confirm request sent to user
      socket.emit('request-sent', {
        message: 'Permission request sent to room host'
      });

    } catch (error) {
      console.error('Request room access error:', error);
      socket.emit('room-error', { message: 'Failed to send request' });
    }
  });

  // Host approves room request
  socket.on('approve-room-request', async (data) => {
    try {
      const { requestId, roomId } = data;
      
      const request = await RoomRequest.findByIdAndUpdate(
        requestId,
        { status: 'approved', respondedAt: new Date() },
        { new: true }
      );

      if (request) {
        // Add user to room participants
        await Room.findByIdAndUpdate(roomId, {
          $addToSet: { participants: request.userId }
        });

        // Notify the requesting user
        io.emit('room-access-granted', {
          userId: request.userId,
          roomId,
          message: 'Your room access has been approved!'
        });

        // Remove notification from host's UI
        socket.emit('request-handled', { requestId });
      }
    } catch (error) {
      console.error('Approve request error:', error);
    }
  });

  // Host rejects room request
  socket.on('reject-room-request', async (data) => {
    try {
      const { requestId } = data;
      
      const request = await RoomRequest.findByIdAndUpdate(
        requestId,
        { status: 'rejected', respondedAt: new Date() },
        { new: true }
      );

      if (request) {
        // Notify the requesting user
        io.emit('room-access-denied', {
          userId: request.userId,
          message: 'Your room access was denied'
        });

        // Remove notification from host's UI
        socket.emit('request-handled', { requestId });
      }
    } catch (error) {
      console.error('Reject request error:', error);
    }
  });

  // Send message
  socket.on('send-message', async (data) => {
    try {
      const { roomId, userId, username, text } = data;
      
      const message = new Message({
        roomId,
        userId,
        username,
        text,
        timestamp: new Date(),
        status: 'delivered'
      });
      await message.save();

      // Broadcast to room
      io.to(roomId).emit('receive-message', {
        id: message._id,
        roomId,
        userId,
        username,
        text,
        timestamp: message.timestamp,
        status: 'delivered'
      });

      // Update room last activity
      await Room.findByIdAndUpdate(roomId, {
        lastActivity: new Date()
      });

    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Typing indicators
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      username: data.username,
      isTyping: true
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      username: data.username,
      isTyping: false
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
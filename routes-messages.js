// Message Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware-auth');
const Message = require('../models-Message');
const Room = require('../models-Room');

// Get messages for a room
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check if user has access to the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // For private rooms, check if user is a participant
    if (room.isPrivate && !room.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const messages = await Message.find({ roomId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { roomId, text } = req.body;
    
    // Check if user has access to the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // For private rooms, check if user is a participant
    if (room.isPrivate && !room.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const message = new Message({
      roomId,
      userId: req.user.id,
      username: req.user.username,
      text
    });
    
    await message.save();
    await message.populate('userId', 'username');
    
    // Update room's last activity
    await Room.findByIdAndUpdate(roomId, { lastActivity: new Date() });
    
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

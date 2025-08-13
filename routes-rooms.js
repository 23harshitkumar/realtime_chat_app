// Room Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware-auth');
const Room = require('../models-Room');
const RoomRequest = require('../models-RoomRequest');

// Get all public rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('createdBy', 'username')
      .sort({ lastActivity: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new room
router.post('/', auth, async (req, res) => {
  try {
    const { name, isPrivate } = req.body;
    const room = new Room({
      name,
      isPrivate: isPrivate || false,
      createdBy: req.user.id,
      participants: [req.user.id]
    });
    await room.save();
    await room.populate('createdBy', 'username');
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get room by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('participants', 'username');
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

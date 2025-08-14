const express = require('express');
const Room = require('../models/Room');
const RoomRequest = require('../models/RoomRequest');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new room
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPrivate, maxParticipants } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room name is required' 
      });
    }

    const room = new Room({
      name,
      description,
      createdBy: req.user._id,
      participants: [req.user._id],
      isPrivate: isPrivate || false,
      maxParticipants: maxParticipants || 100
    });

    await room.save();
    await room.populate('createdBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room }
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating room' 
    });
  }
});

// Get all public rooms
router.get('/public', async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('createdBy', 'username email')
      .populate('participants', 'username email')
      .sort({ lastActivity: -1 })
      .limit(50);

    res.json({
      success: true,
      data: { rooms }
    });

  } catch (error) {
    console.error('Get public rooms error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching rooms' 
    });
  }
});

// Get user's rooms
router.get('/my-rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ 
      participants: req.user._id 
    })
      .populate('createdBy', 'username email')
      .populate('participants', 'username email')
      .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: { rooms }
    });

  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching user rooms' 
    });
  }
});

// Get room by ID
router.get('/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('createdBy', 'username email')
      .populate('participants', 'username email');

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Check if user has access to room
    const hasAccess = room.participants.some(p => p._id.toString() === req.user._id.toString()) || 
                     !room.isPrivate;

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this room' 
      });
    }

    res.json({
      success: true,
      data: { room }
    });

  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching room' 
    });
  }
});

// Request to join a room
router.post('/:roomId/request-access', auth, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Check if user is already a participant
    if (room.participants.includes(req.user._id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already a member of this room' 
      });
    }

    // Check if request already exists
    const existingRequest = await RoomRequest.findOne({
      roomId,
      userId: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request already pending' 
      });
    }

    // Create new request
    const roomRequest = new RoomRequest({
      roomId,
      userId: req.user._id,
      username: req.user.username,
      status: 'pending'
    });

    await roomRequest.save();

    res.json({
      success: true,
      message: 'Room access request sent successfully',
      data: { request: roomRequest }
    });

  } catch (error) {
    console.error('Request room access error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while requesting room access' 
    });
  }
});

// Get pending requests for user's rooms
router.get('/requests/pending', auth, async (req, res) => {
  try {
    // Find rooms created by the user
    const userRooms = await Room.find({ createdBy: req.user._id });
    const roomIds = userRooms.map(room => room._id);

    // Find pending requests for these rooms
    const requests = await RoomRequest.find({
      roomId: { $in: roomIds },
      status: 'pending'
    }).populate('roomId', 'name').populate('userId', 'username email');

    res.json({
      success: true,
      data: { requests }
    });

  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching requests' 
    });
  }
});

// Approve room request
router.post('/requests/:requestId/approve', auth, async (req, res) => {
  try {
    const request = await RoomRequest.findById(req.params.requestId)
      .populate('roomId');

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    // Check if user is room creator
    if (request.roomId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only room creator can approve requests' 
      });
    }

    // Update request status
    request.status = 'approved';
    request.respondedAt = new Date();
    await request.save();

    // Add user to room participants
    await Room.findByIdAndUpdate(request.roomId._id, {
      $addToSet: { participants: request.userId }
    });

    res.json({
      success: true,
      message: 'Request approved successfully'
    });

  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while approving request' 
    });
  }
});

// Reject room request
router.post('/requests/:requestId/reject', auth, async (req, res) => {
  try {
    const request = await RoomRequest.findById(req.params.requestId)
      .populate('roomId');

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    // Check if user is room creator
    if (request.roomId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only room creator can reject requests' 
      });
    }

    // Update request status
    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Request rejected successfully'
    });

  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while rejecting request' 
    });
  }
});

module.exports = router;

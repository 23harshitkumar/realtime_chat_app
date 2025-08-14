const express = require('express');
const Message = require('../models/Message');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

const router = express.Router();

// Get messages for a room
router.get('/:roomId', auth, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user has access to room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    const hasAccess = room.participants.includes(req.user._id) || !room.isPrivate;
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this room' 
      });
    }

    // Get messages
    const messages = await Message.find({ roomId })
      .populate('userId', 'username email')
      .populate('replyTo', 'text username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ roomId });
    const totalPages = Math.ceil(totalMessages / limit);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching messages' 
    });
  }
});

// Send a message
router.post('/:roomId', auth, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { text, type, replyTo } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message text is required' 
      });
    }

    // Check if user has access to room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    const hasAccess = room.participants.includes(req.user._id) || !room.isPrivate;
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this room' 
      });
    }

    // Create message
    const message = new Message({
      roomId,
      userId: req.user._id,
      username: req.user.username,
      text: text.trim(),
      type: type || 'text',
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate('userId', 'username email');
    if (replyTo) {
      await message.populate('replyTo', 'text username');
    }

    // Update room last activity
    room.lastActivity = new Date();
    await room.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while sending message' 
    });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message not found' 
      });
    }

    // Check if user is the message author or room creator
    const room = await Room.findById(message.roomId);
    const isAuthor = message.userId.toString() === req.user._id.toString();
    const isRoomCreator = room.createdBy.toString() === req.user._id.toString();

    if (!isAuthor && !isRoomCreator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this message' 
      });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting message' 
    });
  }
});

// Update message status (read/delivered)
router.patch('/:messageId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['sent', 'delivered', 'read'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message not found' 
      });
    }

    res.json({
      success: true,
      message: 'Message status updated',
      data: { message }
    });

  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating message status' 
    });
  }
});

module.exports = router;

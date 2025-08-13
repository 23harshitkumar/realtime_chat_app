// Room Request Model (THIS FIXES YOUR PERMISSION ISSUE)
const mongoose = require('mongoose');

const roomRequestSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure one pending request per user per room
roomRequestSchema.index({ roomId: 1, userId: 1, status: 1 }, { unique: true });

module.exports = mongoose.model('RoomRequest', roomRequestSchema);

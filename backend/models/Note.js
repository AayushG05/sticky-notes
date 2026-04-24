const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    default: '#ffffff'
  },
  pinned: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date
  },
  userId: {
    type: String,
    required: true
  },
  board: {
    type: String,
    default: 'Main'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Note', noteSchema);

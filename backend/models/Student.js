const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,
    required: true,
    unique: true
  },
  class: {
    type: String,
    required: true
  },
  rfidUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  status: {
    type: String,
    enum: ['inside', 'outside'],
    default: 'outside'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', StudentSchema);
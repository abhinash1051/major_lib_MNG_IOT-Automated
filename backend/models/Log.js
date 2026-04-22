const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  eventType: {
    type: String,
    enum: ['entry', 'exit'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'rfid'
  }
});

module.exports = mongoose.model('Log', LogSchema);
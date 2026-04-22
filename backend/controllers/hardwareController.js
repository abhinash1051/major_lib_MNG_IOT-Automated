const fs = require('fs');
const path = require('path');

// @desc    Handle RFID scan from ESP32
// @route   POST /api/hardware/scan
// @access  Public
exports.handleScan = async (req, res) => {
  try {
    const { uid, source, timestamp } = req.body;
    if (!uid) {
      return res.status(400).json({ message: 'RFID UID is required' });
    }

    const primaryPath = path.join(__dirname, '..', '..', 'json', 'students.json');
    const fallbackPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'student.json');
    let raw;
    let canPersist = false;
    if (fs.existsSync(primaryPath)) {
      raw = fs.readFileSync(primaryPath, 'utf-8');
      canPersist = true;
    } else if (fs.existsSync(fallbackPath)) {
      raw = fs.readFileSync(fallbackPath, 'utf-8');
    } else {
      return res.status(404).json({ message: 'Student dataset not found' });
    }

    const students = JSON.parse(raw);
    const idx = students.findIndex(s => s.rfidUID === uid || s.rfidUid === uid);
    if (idx === -1) {
      return res.status(404).json({ message: 'Student not found with this RFID UID' });
    }

    const student = students[idx];
    const eventType = student.status === 'outside' ? 'entry' : 'exit';
    student.status = eventType === 'entry' ? 'inside' : 'outside';

    if (canPersist) {
      try {
        fs.writeFileSync(primaryPath, JSON.stringify(students, null, 2));
      } catch (e) {
        // ignore persistence error, continue emitting event
      }
    }

    const log = {
      _id: `log-${Date.now()}`,
      student: { ...student },
      eventType,
      timestamp: timestamp || Date.now(),
      source: source || 'rfid'
    };

    const io = req.app.get('io');

    // Compute live metrics for dashboard
    const totalSeats = Number(process.env.TOTAL_SEATS || 250);
    const studentsInside = students.filter(s => s.status === 'inside').length;
    const availableSeats = Math.max(0, totalSeats - studentsInside);

    // Persist this scan into json/logs.json for Logs page
    try {
      const fs = require('fs');
      const path = require('path');
      const LOGS_PATH = path.join(__dirname, '..', '..', 'json', 'logs.json');
      if (!fs.existsSync(LOGS_PATH)) {
        fs.writeFileSync(LOGS_PATH, JSON.stringify([], null, 2));
      }
      const existing = JSON.parse(fs.readFileSync(LOGS_PATH, 'utf-8') || '[]');
      const persisted = {
        _id: log._id,
        timestamp: log.timestamp,
        eventType: log.eventType,
        source: log.source,
        uid: student.rfidUID || student.rfidUid || req.body.uid,
        student: {
          _id: student._id || student.rollNo || (student.rfidUID || student.rfidUid) || `uid-${Date.now()}`,
          name: student.name,
          rollNo: student.rollNo || '',
          photo: student.photo || ''
        }
      };
      existing.unshift(persisted);
      // limit file size (optional)
      const bounded = existing.slice(0, 5000);
      fs.writeFileSync(LOGS_PATH, JSON.stringify(bounded, null, 2));
    } catch (e) {
      console.warn('Log persistence failed:', e.message);
    }

    io.emit('scan', { log, student, studentsInside, totalSeats, availableSeats });

    res.status(201).json({ success: true, eventType, student, log });
  } catch (error) {
    console.error('Hardware scan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
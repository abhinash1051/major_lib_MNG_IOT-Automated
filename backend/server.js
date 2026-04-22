require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const bookRoutes = require('./routes/books');
const logRoutes = require('./routes/logs');
const hardwareRoutes = require('./routes/hardware');
const { initSerialPort, closeSerialPort } = require('./services/serialPortService');
const fs = require('fs');
const path = require('path');
const { sendBatchDuesReport } = require('./services/emailService');
const dashboardRoutes = require('./routes/dashboard'); // add this

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

const User = require('./models/User');

// Middleware
app.use(cors());
app.use(express.json());

// Create a default admin user for debugging
const createDefaultAdmin = async () => {
  try {
    const userExists = await User.findOne({ email: 'admin@example.com' });
    if (!userExists) {
      console.log('Creating default admin user...');
      const user = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });
      console.log('Default admin user created:', user);
    } else {
      console.log('Default admin user already exists.');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL || process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('MongoDB connected successfully');
    createDefaultAdmin();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Initialize Serial Port Service for Arduino RFID scanner
const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM3'; // Change to /dev/ttyUSB0 on Linux/Mac
const ARDUINO_BAUD = process.env.ARDUINO_BAUD || 9600;

setTimeout(() => {
  initSerialPort(io, ARDUINO_PORT, ARDUINO_BAUD);
}, 2000); // Wait 2 seconds for server to fully initialize

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/dashboard', dashboardRoutes); // add this

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 8000;
async function checkAndSendDuesEmails() {
  try {
    const studentsPrimary = path.join(__dirname, '..', 'json', 'students.json');
    const studentsFallback = path.join(__dirname, '..', 'frontend', 'public', 'student.json');
    const borrowingsPath = path.join(__dirname, '..', 'json', 'borrowings.json');

    let studentsRaw;
    if (fs.existsSync(studentsPrimary)) {
      studentsRaw = fs.readFileSync(studentsPrimary, 'utf-8');
    } else if (fs.existsSync(studentsFallback)) {
      studentsRaw = fs.readFileSync(studentsFallback, 'utf-8');
    } else {
      console.warn('Student dataset not found for dues email check.');
      return;
    }
    const students = JSON.parse(studentsRaw);

    let borrowings = [];
    if (fs.existsSync(borrowingsPath)) {
      borrowings = JSON.parse(fs.readFileSync(borrowingsPath, 'utf-8'));
    }

    const today = new Date();
    const perDayFine = Number(process.env.PER_DAY_FINE || 10);

    // Collect all students with overdue items
    const duesData = [];
    for (const student of students) {
      const studentBorrowings = borrowings.filter(
        b => b.studentId === student._id || String(b.rollNo) === String(student.rollNo)
      );
      const currentBorrowed = studentBorrowings.filter(b => !b.returned);
      const overdue = currentBorrowed.filter(b => new Date(b.dueDate) < today);
      if (overdue.length === 0) continue;

      const duesAmount = overdue.reduce((sum, b) => {
        const daysLate = Math.ceil((today - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
        return sum + Math.max(0, daysLate) * perDayFine;
      }, 0);

      duesData.push({
        name: student.name || 'Unknown',
        email: student.email || process.env.SMTP_USER || 'no-email',
        overdue,
        duesAmount
      });
    }

    // Send single consolidated batch email
    if (duesData.length > 0) {
      try {
        await sendBatchDuesReport(duesData);
      } catch (err) {
        console.error('Failed to send batch dues report:', err && err.message ? err.message : err);
      }
    } else {
      console.log('No students with overdue items; skipping dues report.');
    }
  } catch (error) {
    console.error('Dues email check error:', error.message);
  }
}

// Run once after server start, then daily
setTimeout(checkAndSendDuesEmails, 5000);
setInterval(checkAndSendDuesEmails, 24 * 60 * 60 * 1000);

// Start server with a retry strategy if the port is already in use.
function startServer(port, maxRetries = 10, attempt = 0) {
  const p = Number(port) + attempt;

  // remove previous error handlers to avoid duplicate handling on retries
  server.removeAllListeners('error');

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${p} in use (EADDRINUSE).`);
      if (attempt < maxRetries) {
        console.log(`Trying next port: ${p + 1} (attempt ${attempt + 1}/${maxRetries})`);
        // wait a short time before retrying
        setTimeout(() => startServer(port, maxRetries, attempt + 1), 500);
      } else {
        console.error(`Failed to bind after ${maxRetries} attempts. Exiting.`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err && err.message ? err.message : err);
      process.exit(1);
    }
  });

  server.listen(p, () => {
    console.log(`Server running on port ${p}`);
  });
}

startServer(PORT);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing serial port...');
  closeSerialPort();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing serial port...');
  closeSerialPort();
  process.exit(0);
});

module.exports = { app, io };
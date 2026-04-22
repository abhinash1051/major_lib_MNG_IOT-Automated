const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// @route   GET api/dashboard/stats
// @desc    Get dashboard statistics (live from JSON datasets)
// @access  Private
router.get('/stats', protect, (req, res) => {
  const studentsPrimary = path.join(__dirname, '..', '..', 'json', 'students.json');
  const studentsFallback = path.join(__dirname, '..', '..', 'frontend', 'public', 'student.json');
  const booksPath = path.join(__dirname, '..', '..', 'json', 'books.json');

  let students = [];
  if (fs.existsSync(studentsPrimary)) {
    students = JSON.parse(fs.readFileSync(studentsPrimary, 'utf-8'));
  } else if (fs.existsSync(studentsFallback)) {
    students = JSON.parse(fs.readFileSync(studentsFallback, 'utf-8'));
  }

  let books = [];
  if (fs.existsSync(booksPath)) {
    books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));
  }

  const totalSeats = Number(process.env.TOTAL_SEATS || 250);
  const studentsInside = students.filter(s => s.status === 'inside').length;
  const availableSeats = Math.max(0, totalSeats - studentsInside);

  const totalBooks = books.reduce((sum, b) => sum + (Number(b.totalCopies) || 0), 0);
  const availableBooks = books.reduce((sum, b) => sum + (Number(b.availableCopies) || 0), 0);
  const borrowedBooks = Math.max(0, totalBooks - availableBooks);

  res.json({
    studentsInside,
    totalStudents: students.length,
    totalBooks,
    availableBooks,
    borrowedBooks,
    totalSeats,
    availableSeats
  });
});

module.exports = router;
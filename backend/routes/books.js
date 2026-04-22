const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Serve books from JSON dataset
const fs = require('fs');
const path = require('path');

const getBooks = (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../json/books.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    // Normalize location fields for frontend compatibility
    const normalized = data.map(b => ({
      ...b,
      location: {
        shelf: b.location?.shelf || '',
        row: b.location?.row || '',
        column: b.location?.cell || '',
        department: b.location?.department || ''
      }
    }));

    res.status(200).json(normalized);
  } catch (err) {
    console.error('Error reading books JSON:', err);
    res.status(500).json({ message: 'Failed to load books' });
  }
};

const getBook = (req, res) => {
  res.status(200).json({
    _id: req.params.id,
    title: 'Sample Book',
    author: 'Sample Author',
    isbn: '1234567890',
    barcode: 'B00001',
    totalCopies: 5,
    availableCopies: 3,
    location: {
      shelf: 'A',
      row: '1',
      column: '2'
    },
    createdAt: new Date()
  });
};

const createBook = (req, res) => {
  res.status(201).json({
    _id: 'new-id',
    ...req.body,
    createdAt: new Date()
  });
};

const updateBook = (req, res) => {
  res.status(200).json({
    _id: req.params.id,
    ...req.body,
    updatedAt: new Date()
  });
};

const deleteBook = (req, res) => {
  res.status(200).json({ success: true });
};

const importBooks = (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Books imported successfully',
    count: 5
  });
};

const exportBooks = (req, res) => {
  // In a real implementation, this would generate and send an Excel file
  res.status(200).json({ 
    success: true, 
    message: 'This endpoint would normally send an Excel file'
  });
};

// Define routes
router.route('/')
  .get(protect, getBooks)
  .post(protect, authorize('admin', 'librarian'), createBook);

router.route('/:id')
  .get(protect, getBook)
  .put(protect, authorize('admin', 'librarian'), updateBook)
  .delete(protect, authorize('admin'), deleteBook);

router.post('/import', protect, authorize('admin', 'librarian'), upload.single('file'), importBooks);
router.get('/export', protect, exportBooks);

module.exports = router;
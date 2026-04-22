const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  exportStudents,
  getStudentProfile
} = require('../controllers/studentController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
  .get(protect, getStudents)
  .post(protect, createStudent);

router.get('/:id/profile', protect, getStudentProfile);

router.get('/rfid/:uid', protect, getStudent); // Fetch by RFID UID

router.route('/:id')
  .get(protect, getStudent)
  .put(protect, updateStudent)
  .delete(protect, deleteStudent);

router.post('/import', protect, upload.single('file'), importStudents);
router.get('/export', protect, exportStudents);

module.exports = router;
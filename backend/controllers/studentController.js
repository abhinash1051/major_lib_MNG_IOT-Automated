const Student = require('../models/Student');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res) => {
  try {
    const primaryPath = path.join(__dirname, '..', '..', 'json', 'students.json');
    const fallbackPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'student.json');
    let raw;
    if (fs.existsSync(primaryPath)) {
      raw = fs.readFileSync(primaryPath, 'utf-8');
    } else if (fs.existsSync(fallbackPath)) {
      raw = fs.readFileSync(fallbackPath, 'utf-8');
    } else {
      return res.json([]);
    }
    const students = JSON.parse(raw);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const primaryPath = path.join(__dirname, '..', '..', 'json', 'students.json');
    const fallbackPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'student.json');
    let raw;
    if (fs.existsSync(primaryPath)) {
      raw = fs.readFileSync(primaryPath, 'utf-8');
    } else if (fs.existsSync(fallbackPath)) {
      raw = fs.readFileSync(fallbackPath, 'utf-8');
    } else {
      return res.status(404).json({ message: 'Student dataset not found' });
    }
    const students = JSON.parse(raw);
    const id = req.params.id;
    const student = students.find(s => s._id === id || String(s.rollNo) === String(id) || s.rfidUid === id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc    Create new student
// @route   POST /api/students
// @access  Private
exports.createStudent = async (req, res) => {
  try {
    const { name, rollNo, class: studentClass, rfidUid, email, photo } = req.body;
    
    // Check if student with same rollNo or rfidUid exists
    const studentExists = await Student.findOne({ 
      $or: [{ rollNo }, { rfidUid }]
    });
    
    if (studentExists) {
      return res.status(400).json({ message: 'Student with this Roll No or RFID UID already exists' });
    }
    
    const student = await Student.create({
      name,
      rollNo,
      class: studentClass,
      rfidUid,
      email,
      photo,
      status: 'outside'
    });
    
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
exports.updateStudent = async (req, res) => {
  try {
    const { name, rollNo, class: studentClass, rfidUid, email, photo } = req.body;
    
    let student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if updated rollNo or rfidUid already exists for another student
    if (rollNo !== student.rollNo || rfidUid !== student.rfidUid) {
      const duplicateStudent = await Student.findOne({
        $or: [
          { rollNo, _id: { $ne: req.params.id } },
          { rfidUid, _id: { $ne: req.params.id } }
        ]
      });
      
      if (duplicateStudent) {
        return res.status(400).json({ message: 'Student with this Roll No or RFID UID already exists' });
      }
    }
    
    student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        rollNo,
        class: studentClass,
        rfidUid,
        email,
        photo
      },
      { new: true }
    );
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    await student.deleteOne();
    res.json({ message: 'Student removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Import students from Excel/CSV
// @route   POST /api/students/import
// @access  Private
exports.importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    if (data.length === 0) {
      return res.status(400).json({ message: 'No data found in the file' });
    }
    
    const students = [];
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const { name, rollNo, class: studentClass, rfidUid, email, photo } = data[i];
      
      if (!name || !rollNo || !studentClass || !rfidUid || !email) {
        errors.push(`Row ${i + 2}: Missing required fields`);
        continue;
      }
      
      // Check if student already exists
      const studentExists = await Student.findOne({ 
        $or: [{ rollNo }, { rfidUid }]
      });
      
      if (studentExists) {
        errors.push(`Row ${i + 2}: Student with Roll No ${rollNo} or RFID UID ${rfidUid} already exists`);
        continue;
      }
      
      const student = await Student.create({
        name,
        rollNo,
        class: studentClass,
        rfidUid,
        email,
        photo: photo || 'default.jpg',
        status: 'outside'
      });
      
      students.push(student);
    }
    
    res.status(201).json({
      message: `${students.length} students imported successfully`,
      errors: errors.length > 0 ? errors : undefined,
      students
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Export students to Excel/CSV
// @route   GET /api/students/export
// @access  Private
exports.exportStudents = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', '..', 'json', 'students.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const students = JSON.parse(raw);
    
    const data = students.map(student => ({
      name: student.name,
      rollNo: student.rollNo,
      class: student.class,
      rfidUid: student.rfidUid,
      email: student.email,
      photo: student.photo,
      status: student.status
    }));
    
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const studentsPrimary = path.join(__dirname, '..', '..', 'json', 'students.json');
    const studentsFallback = path.join(__dirname, '..', '..', 'frontend', 'public', 'student.json');
    const borrowingsPath = path.join(__dirname, '..', '..', 'json', 'borrowings.json');

    let studentsRaw;
    if (fs.existsSync(studentsPrimary)) {
      studentsRaw = fs.readFileSync(studentsPrimary, 'utf-8');
    } else if (fs.existsSync(studentsFallback)) {
      studentsRaw = fs.readFileSync(studentsFallback, 'utf-8');
    } else {
      return res.status(404).json({ message: 'Student dataset not found' });
    }
    const students = JSON.parse(studentsRaw);

    let borrowings = [];
    if (fs.existsSync(borrowingsPath)) {
      borrowings = JSON.parse(fs.readFileSync(borrowingsPath, 'utf-8'));
    }

    const id = req.params.id;
    const student = students.find(s => s._id === id || String(s.rollNo) === String(id) || s.rfidUid === id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentBorrowings = borrowings.filter(b => b.studentId === student._id || String(b.rollNo) === String(student.rollNo));
    const today = new Date();
    const perDayFine = 10;
    const currentBorrowed = studentBorrowings.filter(b => !b.returned);
    const overdue = currentBorrowed.filter(b => new Date(b.dueDate) < today);
    const duesAmount = overdue.reduce((sum, b) => {
      const daysLate = Math.ceil((today - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, daysLate) * perDayFine;
    }, 0);

    res.json({
      student,
      summary: {
        currentBorrowedCount: currentBorrowed.length,
        totalHistoryCount: studentBorrowings.length,
        overdueCount: overdue.length,
        duesAmount
      },
      currentBorrowed,
      history: studentBorrowings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
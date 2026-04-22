import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FiX, FiBook, FiDollarSign, FiCalendar, FiUser } from 'react-icons/fi';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    class: '',
    rfidUID: '',
    email: '',
    year: '',
    batch: '',
    photo: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetchStudentsFromJson();
  }, []);

  // Listen for RFID scans
  useEffect(() => {
    const socket = io((process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/api$/, ''));

    socket.on('scan', (data) => {
      console.log('📱 RFID Scan Detected in Students Section:', data);
      console.log('📋 Available students:', students.map(s => ({ name: s.name, rfidUID: s.rfidUID, rollNo: s.rollNo })));

      // Find student by uid, enrollmentNumber, or name
      const scannedStudent = students.find(s => {
        const uidMatch = s.rfidUID && data.uid && String(s.rfidUID).toLowerCase() === String(data.uid).toLowerCase();
        const enrollmentMatch = s.rollNo && data.enrollmentNumber && String(s.rollNo).toLowerCase() === String(data.enrollmentNumber).toLowerCase();
        const nameMatch = s.name && data.name && s.name.toLowerCase() === data.name.toLowerCase();

        console.log(`🔍 Checking ${s.name}: UID match=${uidMatch}, Enrollment match=${enrollmentMatch}, Name match=${nameMatch}`);

        return uidMatch || enrollmentMatch || nameMatch;
      });

      console.log('✅ Scanned student found:', scannedStudent);

      if (scannedStudent) {
        console.log('🎯 Opening popup for:', scannedStudent.name);
        setSelectedStudent(scannedStudent);
        fetchStudentProfile(scannedStudent.rollNo || scannedStudent.rfidUID || scannedStudent._id);
      } else {
        console.warn('⚠️ No matching student found for scan:', data);
      }
    });

    return () => socket.disconnect();
  }, [students]);

  // Function to fetch students from backend API with fallback to public JSON
  const fetchStudentsFromJson = async () => {
    setLoading(true);
    // Helper to normalize array of student objects
    const normalize = (arr) => arr.map(student => ({
      _id: student.id || student._id || Math.random().toString(36).substr(2, 9),
      name: student.name || '',
      rollNo: student.rollNo || student.roll_number || '',
      class: student.class || student.className || student.department || '',
      rfidUID: student.rfidUID || student.rfid_uid || student.rfid || '',
      email: student.email || '',
      year: student.year || '2023',
      batch: student.batch || '2022',
      photo: student.photo || ''
    }));

    // Try API first
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${(process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/students`, { headers });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setStudents(normalize(res.data));
        setLoading(false);
        return;
      }
      // If API returns empty, fallthrough to local JSON
      console.warn('Students API returned empty array, falling back to local student.json');
    } catch (apiErr) {
      console.warn('Students API fetch failed, falling back to local student.json:', apiErr.message || apiErr);
    }

    // Fallback to public/student.json
    try {
      const resp = await fetch('/student.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setStudents(normalize(data));
    } catch (jsonErr) {
      console.error('Failed to load local student.json fallback:', jsonErr);
      setError('Failed to load students (API and local fallback both failed)');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        // Update existing student
        const updatedStudents = students.map(student =>
          student._id === editingId ? { ...formData, _id: editingId } : student
        );
        setStudents(updatedStudents);
        setSuccess('Student updated successfully!');
      } else {
        // Create new student
        const newStudent = {
          ...formData,
          _id: Math.random().toString(36).substr(2, 9)
        };
        setStudents([...students, newStudent]);
        setSuccess('Student added successfully!');
      }

      // Reset form
      setFormData({
        name: '',
        rollNo: '',
        class: '',
        rfidUID: '',
        email: '',
        year: '',
        batch: '',
        photo: ''
      });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving student:', error);
      setError('Error saving student data');
    }
  };

  const handleEdit = (student) => {
    setFormData({
      name: student.name,
      rollNo: student.rollNo,
      class: student.class,
      rfidUID: student.rfidUID,
      email: student.email,
      year: student.year,
      batch: student.batch,
      photo: student.photo
    });
    setEditingId(student._id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const updatedStudents = students.filter(student => student._id !== id);
        setStudents(updatedStudents);
        setSuccess('Student deleted successfully!');
      } catch (error) {
        console.error('Error deleting student:', error);
        setError('Error deleting student');
      }
    }
  };

  const fetchStudentProfile = async (studentId) => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/students/${studentId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentProfile(res.data);
    } catch (e) {
      console.error('Error fetching student profile:', e);
      setError('Failed to load student profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDemoScan = () => {
    const demoUID = 'c340f27';
    const scannedStudent = students.find(s =>
      (s.rfidUID && String(s.rfidUID).toLowerCase() === demoUID) ||
      (s.name && s.name.toLowerCase() === 'abhinesh kumar')
    );
    if (scannedStudent) {
      setSelectedStudent(scannedStudent);
      fetchStudentProfile(scannedStudent.rollNo || scannedStudent.rfidUID || scannedStudent._id);
    } else {
      setError('Demo RFID UID not found in current list');
    }
  };

  const closePopup = () => {
    setSelectedStudent(null);
    setStudentProfile(null);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rfidUID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.year.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Students Management</h1>
        <div className="flex gap-3">
          <button onClick={handleDemoScan} className="btn-secondary">Demo RFID Scan</button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                name: '',
                rollNo: '',
                class: '',
                rfidUID: '',
                email: '',
                year: '',
                batch: '',
                photo: ''
              });
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : 'Add Student'}
          </button>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      {/* Student Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Student' : 'Add New Student'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rollNo">Roll Number</label>
                <input
                  type="text"
                  id="rollNo"
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="class">Class</label>
                <input
                  type="text"
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rfidUID">RFID UID</label>
                <input
                  type="text"
                  id="rfidUID"
                  name="rfidUID"
                  value={formData.rfidUID}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="year">Year</label>
                <input
                  type="text"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="batch">Batch</label>
                <input
                  type="text"
                  id="batch"
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search students by name, roll number, class, email, RFID, year or batch..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input w-full"
        />
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFID UID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">No students found</td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary-500 text-white">
                          {student.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.rollNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.rfidUID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.batch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/students/${student.rollNo || student.rfidUID || student._id}`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Student Details Popup Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4 flex justify-between items-center border-b">
              <h2 className="text-xl font-bold">Student Details</h2>
              <button
                onClick={closePopup}
                className="text-white hover:text-gray-200 transition"
              >
                <FiX size={24} />
              </button>
            </div>

            {profileLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Loading profile...</p>
              </div>
            ) : studentProfile ? (
              <div className="p-6 space-y-6">
                {/* Student Info Section */}
                <div className="border-b pb-4">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-primary-500 text-white flex items-center justify-center text-3xl flex-shrink-0">
                      {studentProfile.student?.name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900">{studentProfile.student?.name || 'N/A'}</h3>
                      <p className="text-gray-600">{studentProfile.student?.email || 'N/A'}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <p><span className="font-semibold">Roll No:</span> {studentProfile.student?.rollNo || 'N/A'}</p>
                        <p><span className="font-semibold">Department:</span> {studentProfile.student?.class || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                    <FiBook className="mx-auto mb-2 text-blue-600" size={24} />
                    <p className="text-2xl font-bold text-blue-900">{studentProfile.summary?.currentBorrowedCount || 0}</p>
                    <p className="text-xs text-blue-700">Books Borrowed</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                    <FiCalendar className="mx-auto mb-2 text-red-600" size={24} />
                    <p className="text-2xl font-bold text-red-900">{studentProfile.summary?.overdueCount || 0}</p>
                    <p className="text-xs text-red-700">Overdue Books</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                    <FiDollarSign className="mx-auto mb-2 text-orange-600" size={24} />
                    <p className="text-2xl font-bold text-orange-900">₹{Number(studentProfile.summary?.duesAmount || 0).toFixed(2)}</p>
                    <p className="text-xs text-orange-700">Dues Amount</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                    <FiUser className="mx-auto mb-2 text-purple-600" size={24} />
                    <p className="text-2xl font-bold text-purple-900">{studentProfile.summary?.totalHistoryCount || 0}</p>
                    <p className="text-xs text-purple-700">Total History</p>
                  </div>
                </div>

                {/* Currently Borrowed Books */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <FiBook className="mr-2 text-primary-600" />
                    Currently Borrowed ({studentProfile.currentBorrowed?.length || 0})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Title</th>
                          <th className="px-4 py-2 text-left font-semibold">Barcode</th>
                          <th className="px-4 py-2 text-left font-semibold">Borrowed</th>
                          <th className="px-4 py-2 text-left font-semibold">Due Date</th>
                          <th className="px-4 py-2 text-left font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentProfile.currentBorrowed?.length > 0 ? (
                          studentProfile.currentBorrowed.map((book, idx) => {
                            const overdue = new Date(book.dueDate) < new Date();
                            return (
                              <tr key={book._id || idx} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2">{book.title || 'N/A'}</td>
                                <td className="px-4 py-2">{book.barcode || 'N/A'}</td>
                                <td className="px-4 py-2">{book.borrowDate ? new Date(book.borrowDate).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-4 py-2">{book.dueDate ? new Date(book.dueDate).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${overdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {overdue ? 'Overdue' : 'On Time'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                              No books currently borrowed
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Borrowing History */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <FiCalendar className="mr-2 text-primary-600" />
                    Borrowing History ({studentProfile.history?.length || 0})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Title</th>
                          <th className="px-4 py-2 text-left font-semibold">Borrowed</th>
                          <th className="px-4 py-2 text-left font-semibold">Due</th>
                          <th className="px-4 py-2 text-left font-semibold">Returned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentProfile.history?.length > 0 ? (
                          studentProfile.history.slice(0, 10).map((book, idx) => (
                            <tr key={book._id || idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2">{book.title || 'N/A'}</td>
                              <td className="px-4 py-2">{book.borrowDate ? new Date(book.borrowDate).toLocaleDateString() : 'N/A'}</td>
                              <td className="px-4 py-2">{book.dueDate ? new Date(book.dueDate).toLocaleDateString() : 'N/A'}</td>
                              <td className="px-4 py-2">{book.returnDate ? new Date(book.returnDate).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                              No history found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {studentProfile.history?.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Showing 10 of {studentProfile.history.length} records
                      </p>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={closePopup}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-600">No profile data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
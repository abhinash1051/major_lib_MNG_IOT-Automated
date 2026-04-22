import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiBook, FiCalendar, FiClock, FiDollarSign, FiArrowLeft, FiCheck, FiAlertCircle, FiAward } from 'react-icons/fi'; // Removed FiX
import studentPhoto from '../abhinesh.png'; // Import the student photo

const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('current');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/students/${id}/profile`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setProfile(res.data);
            } catch (e) {
                setError(e.response?.data?.message || 'Failed to load student profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    // Listen for RFID scans and auto-navigate to the scanned student's profile
    useEffect(() => {
        const socket = io((process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/api$/, ''));

        socket.on('scan', (data) => {
            console.log('📱 RFID Scan Detected on Profile Page:', data);
            // Auto-navigate to the scanned student's profile
            if (data.uid || data.enrollmentNumber) {
                navigate(`/student-profile/${data.enrollmentNumber || data.uid}`);
            }
        });

        return () => socket.disconnect();
    }, [navigate]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen">
            <div className="bg-red-900/50 backdrop-blur-lg rounded-xl p-6 max-w-md text-center">
                <FiAlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Error Loading Profile</h3>
                <p className="text-red-200">{error}</p>
                <button
                    onClick={() => navigate('/students')}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    Back to Students
                </button>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="flex items-center justify-center h-screen">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 max-w-md text-center">
                <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Profile Data</h3>
                <p className="text-gray-300">Unable to load student profile information</p>
                <button
                    onClick={() => navigate('/students')}
                    className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    Back to Students
                </button>
            </div>
        </div>
    );

    const { student, summary = {}, currentBorrowed = [], history = [] } = profile;
    if (!student) return (
        <div className="flex items-center justify-center h-screen">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 max-w-md text-center">
                <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Invalid Profile Data</h3>
                <p className="text-gray-300">Student information is not available</p>
                <button
                    onClick={() => navigate('/students')}
                    className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    Back to Students
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center">
                    <Link
                        to="/students"
                        className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors mr-4"
                    >
                        <FiArrowLeft className="mr-2" /> Back to Students
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Student Profile</h1>
                </div>
                <div className="text-sm text-gray-400">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* Student Info Card */}
            <motion.div
                className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700 p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Student Photo */}
                    <motion.div
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="relative">
                            <img
                                src={studentPhoto}
                                alt={`${student.name}'s profile`}
                                className="h-32 w-32 rounded-full object-cover border-4 border-indigo-500 shadow-lg"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                                }}
                            />
                            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-500 border-2 border-gray-800 flex items-center justify-center">
                                <FiCheck className="text-white text-sm" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Student Details */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white">{student.name || 'N/A'}</h2>
                            <div className="flex items-center mt-2 md:mt-0">
                                <span className="px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm font-medium">
                                    {student.class || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center justify-center md:justify-start">
                                <FiMail className="text-gray-400 mr-2" />
                                <span className="text-gray-300">{student.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start">
                                <FiUser className="text-gray-400 mr-2" />
                                <span className="text-gray-300">Roll No: {student.rollNo || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start">
                                <FiCalendar className="text-gray-400 mr-2" />
                                <span className="text-gray-300">
                                    {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start">
                                <FiAward className="text-gray-400 mr-2" />
                                <span className="text-gray-300">
                                    {student.year || 'N/A'} Year
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                    className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-700/50 p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-indigo-700/50 mr-4">
                            <FiBook className="text-indigo-400 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-indigo-300">Current Borrowed</p>
                            <p className="text-3xl font-bold text-white">{summary?.currentBorrowedCount || 0}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="bg-gradient-to-br from-red-900/50 to-red-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-red-700/50 p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-red-700/50 mr-4">
                            <FiAlertCircle className="text-red-400 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-red-300">Overdue Books</p>
                            <p className="text-3xl font-bold text-white">{summary?.overdueCount || 0}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-yellow-700/50 p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-yellow-700/50 mr-4">
                            <FiDollarSign className="text-yellow-400 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-yellow-300">Outstanding Dues</p>
                            <p className="text-3xl font-bold text-white">{currency(summary?.duesAmount || 0)}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Borrowing Information */}
            <motion.div
                className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    <button
                        className={`px-6 py-4 font-medium ${activeTab === 'current' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('current')}
                    >
                        Currently Borrowed
                    </button>
                    <button
                        className={`px-6 py-4 font-medium ${activeTab === 'history' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Borrowing History
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'current' && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Currently Borrowed Books</h3>
                            {currentBorrowed.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Book</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Borrowed Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {currentBorrowed.map((b, idx) => {
                                                const overdue = new Date(b.dueDate) < new Date();
                                                return (
                                                    <tr key={b._id || `borrow-${idx}`} className="hover:bg-gray-700/50">
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-medium text-white">{b.title || 'N/A'}</div>
                                                            <div className="text-sm text-gray-400">{b.barcode || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-300">
                                                            {b.borrowDate ? new Date(b.borrowDate).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className={`px-4 py-4 text-sm ${overdue ? 'text-red-400' : 'text-gray-300'}`}>
                                                            {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${overdue ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                                                                {overdue ? 'Overdue' : 'On Time'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FiBook className="mx-auto h-12 w-12 text-gray-500" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-300">No books currently borrowed</h3>
                                    <p className="mt-1 text-sm text-gray-500">This student has not borrowed any books yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Borrowing History</h3>
                            {history.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Book</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Borrowed Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Returned Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {history.map((b, idx) => (
                                                <tr key={b._id || `history-${idx}`} className="hover:bg-gray-700/50">
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm font-medium text-white">{b.title || 'N/A'}</div>
                                                        <div className="text-sm text-gray-400">{b.barcode || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-300">
                                                        {b.borrowDate ? new Date(b.borrowDate).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-300">
                                                        {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-300">
                                                        {b.returned ? (b.returnDate ? new Date(b.returnDate).toLocaleDateString() : 'N/A') : 'Not Returned'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FiClock className="mx-auto h-12 w-12 text-gray-500" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-300">No borrowing history</h3>
                                    <p className="mt-1 text-sm text-gray-500">This student has no borrowing history yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default StudentProfile;
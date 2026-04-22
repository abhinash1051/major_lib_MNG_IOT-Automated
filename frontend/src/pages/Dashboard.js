import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { FiUsers, FiBook, FiUserCheck, FiClock, FiActivity, FiSun, FiMoon, FiStar, FiTrendingUp, FiCalendar, FiAlertCircle, FiBookOpen, FiBarChart2 } from 'react-icons/fi';

// Animated Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, delay = 0, subtitle, trend }) => (
  <motion.div
    className="relative overflow-hidden rounded-2xl bg-gray-800/80 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-700"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5 }}
  >
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: color }}></div>
    <div className="p-6 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-300 text-sm font-medium">{title}</p>
          <motion.p
            className="text-3xl font-bold mt-1 text-white"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {value}
          </motion.p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-xs text-gray-400 ml-1">from last week</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-full`} style={{ backgroundColor: `${color}20`, color }}>
          <Icon className="text-2xl" />
        </div>
      </div>
      <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (value / (title.includes('Students') ? 300 : 2000)) * 100)}%` }}
          transition={{ duration: 1, delay: delay + 0.3 }}
        ></motion.div>
      </div>
    </div>
  </motion.div>
);

// Book Card Component
const BookCard = ({ book, index, isPopular = false }) => (
  <motion.div
    className={`bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-gray-700 ${isPopular ? 'flex' : ''}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.1 * index }}
    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}
  >
    {isPopular ? (
      <>
        <div className="w-1/3 p-4 flex items-center justify-center bg-gradient-to-br from-gray-700/50 to-gray-800/50">
          <div className="h-32 w-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md flex items-center justify-center text-white font-bold text-lg">
            {book.title.substring(0, 2)}
          </div>
        </div>
        <div className="w-2/3 p-4">
          <h3 className="font-bold text-white truncate">{book.title}</h3>
          <p className="text-sm text-gray-300 mt-1">{book.author}</p>
          <div className="flex items-center mt-3">
            <div className="flex items-center text-yellow-400">
              <FiStar className="fill-current" />
              <span className="ml-1 text-gray-200 font-medium">{book.rating}</span>
            </div>
            <div className="ml-4 flex items-center text-indigo-400">
              <FiTrendingUp className="mr-1" />
              <span className="text-sm font-medium">{book.borrowCount} borrows</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-block bg-indigo-900/50 text-indigo-300 text-xs px-2 py-1 rounded-full">
              {book.category}
            </span>
          </div>
        </div>
      </>
    ) : (
      <>
        <div className="p-4">
          <div className="h-32 w-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md flex items-center justify-center text-white font-bold text-lg mb-3">
            {book.title.substring(0, 2)}
          </div>
          <h3 className="font-bold text-white truncate">{book.title}</h3>
          <p className="text-sm text-gray-300 mt-1">{book.author}</p>
          <div className="flex items-center mt-3">
            <div className="flex items-center text-yellow-400">
              <FiStar className="fill-current" />
              <span className="ml-1 text-gray-200 font-medium">{book.rating}</span>
            </div>
            <div className="ml-4 flex items-center text-indigo-400">
              <FiCalendar className="mr-1" />
              <span className="text-sm font-medium">Added {book.addedDate}</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-block bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded-full">
              New Arrival
            </span>
          </div>
        </div>
      </>
    )}
  </motion.div>
);

// Due Date Alerts Component
const DueDateAlerts = () => {
  // Sample data for due date alerts
  const overdueBooks = [
    { id: 1, title: "The Silent Patient", student: "John Doe", dueDate: "2 days ago", daysOverdue: 2 },
    { id: 2, title: "Educated", student: "Jane Smith", dueDate: "1 day ago", daysOverdue: 1 },
  ];

  const dueSoonBooks = [
    { id: 3, title: "Where the Crawdads Sing", student: "Robert Johnson", dueDate: "Tomorrow", daysLeft: 1 },
    { id: 4, title: "Atomic Habits", student: "Emily Davis", dueDate: "In 2 days", daysLeft: 2 },
    { id: 5, title: "The Midnight Library", student: "Michael Wilson", dueDate: "In 3 days", daysLeft: 3 },
  ];

  return (
    <motion.div
      className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center">
          <FiAlertCircle className="mr-2 text-red-400" />
          Due Date Alerts
        </h2>
      </div>

      <div className="p-6">
        {/* Overdue Books Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
            <FiAlertCircle className="mr-2" />
            Overdue Books
          </h3>
          <div className="space-y-3">
            {overdueBooks.map((book, index) => (
              <motion.div
                key={book.id}
                className="bg-red-900/30 rounded-lg p-4 border-l-4 border-red-500"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">{book.title}</h4>
                    <p className="text-sm text-gray-300 mt-1">Borrowed by: {book.student}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-red-900/50 text-red-300 text-xs px-2 py-1 rounded-full">
                      {book.daysOverdue} day{book.daysOverdue > 1 ? 's' : ''} overdue
                    </span>
                    <p className="text-xs text-gray-400 mt-1">Due: {book.dueDate}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Due Soon Books Section */}
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
            <FiClock className="mr-2" />
            Due Soon
          </h3>
          <div className="space-y-3">
            {dueSoonBooks.map((book, index) => (
              <motion.div
                key={book.id}
                className="bg-yellow-900/30 rounded-lg p-4 border-l-4 border-yellow-500"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">{book.title}</h4>
                    <p className="text-sm text-gray-300 mt-1">Borrowed by: {book.student}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-yellow-900/50 text-yellow-300 text-xs px-2 py-1 rounded-full">
                      Due {book.dueDate}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{book.daysLeft} day{book.daysLeft > 1 ? 's' : ''} left</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Reading Statistics Component
const ReadingStatistics = () => {
  // Sample data for genre distribution
  const genreData = [
    { name: 'Fiction', value: 35 },
    { name: 'Science', value: 20 },
    { name: 'History', value: 15 },
    { name: 'Biography', value: 12 },
    { name: 'Technology', value: 10 },
    { name: 'Other', value: 8 }
  ];

  // Sample data for monthly reading trends
  const monthlyTrends = [
    { month: 'Jan', books: 120 },
    { month: 'Feb', books: 150 },
    { month: 'Mar', books: 180 },
    { month: 'Apr', books: 200 },
    { month: 'May', books: 170 },
    { month: 'Jun', books: 190 }
  ];

  // Colors for pie chart
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <motion.div
      className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center">
          <FiBarChart2 className="mr-2 text-indigo-400" />
          Reading Statistics
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Genre Distribution */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Genre Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trends */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Reading Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Area type="monotone" dataKey="books" stroke="#6366f1" fill="#4f46e5" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Readers */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiBookOpen className="mr-2 text-indigo-400" />
            Top Readers This Month
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "John Doe", books: 8, avatar: "JD" },
              { name: "Jane Smith", books: 7, avatar: "JS" },
              { name: "Robert Johnson", books: 6, avatar: "RJ" }
            ].map((reader, index) => (
              <motion.div
                key={index}
                className="bg-indigo-900/30 rounded-lg p-4 flex items-center border border-indigo-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold mr-4">
                  {reader.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-white">{reader.name}</h4>
                  <p className="text-sm text-gray-300">{reader.books} books read</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Book Discovery Section
const BookDiscovery = () => {
  // Sample data for popular books
  const popularBooks = [
    { id: 1, title: "The Silent Patient", author: "Alex Michaelides", rating: 4.5, borrowCount: 42, category: "Thriller" },
    { id: 2, title: "Educated", author: "Tara Westover", rating: 4.7, borrowCount: 38, category: "Memoir" },
    { id: 3, title: "Where the Crawdads Sing", author: "Delia Owens", rating: 4.8, borrowCount: 35, category: "Fiction" },
    { id: 4, title: "Atomic Habits", author: "James Clear", rating: 4.6, borrowCount: 32, category: "Self-Help" },
  ];

  // Sample data for new arrivals
  const newArrivals = [
    { id: 5, title: "Project Hail Mary", author: "Andy Weir", rating: 4.9, addedDate: "2 days ago" },
    { id: 6, title: "Klara and the Sun", author: "Kazuo Ishiguro", rating: 4.3, addedDate: "1 week ago" },
    { id: 7, title: "The Four Winds", author: "Kristin Hannah", rating: 4.7, addedDate: "1 week ago" },
    { id: 8, title: "The Midnight Library", author: "Matt Haig", rating: 4.4, addedDate: "2 weeks ago" },
  ];

  return (
    <motion.div
      className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center">
          <FiBook className="mr-2 text-indigo-400" />
          Book Discovery
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button className="px-6 py-3 font-medium text-indigo-300 border-b-2 border-indigo-500">
          Popular Books
        </button>
        <button className="px-6 py-3 font-medium text-gray-400 hover:text-gray-300">
          New Arrivals
        </button>
        <button className="px-6 py-3 font-medium text-gray-400 hover:text-gray-300">
          Recommended For You
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-indigo-400" />
            Most Popular This Week
          </h3>
          <div className="space-y-4">
            {popularBooks.map((book, index) => (
              <BookCard key={book.id} book={book} index={index} isPopular={true} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiCalendar className="mr-2 text-indigo-400" />
            New Arrivals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newArrivals.map((book, index) => (
              <BookCard key={book.id} book={book} index={index} isPopular={false} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState({
    studentsInside: 0,
    totalStudents: 0,
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    totalSeats: 150,
    availableSeats: 150
  });
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  // Calculate occupancy percentage
  const occupancyPct = (typeof stats.totalSeats === 'number' && stats.totalSeats > 0)
    ? Math.round((stats.studentsInside / stats.totalSeats) * 100)
    : 0;

  useEffect(() => {
    // Connect to Socket.IO server
    const socket = io((process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/api$/, ''));

    socket.on('connect', () => {
      console.log('✓ Connected to backend Socket.IO');
    });

    // Listen for real-time scan events (normalize payloads from different emitters)
    socket.on('scan', (data) => {
      console.log('📱 Scan event received:', data);

      // Normalize payload: some emitters send { log: {...} }, others send the raw scan object
      let payload = data && data.log ? data.log : data;

      // If payload is a string (older serial lines), try to parse JSON safely
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          // Not JSON — ignore non-parseable strings
          console.warn('Received non-JSON scan payload, ignoring:', payload);
          return;
        }
      }

      setStats(prevStats => {
        let studentsInside = typeof prevStats.studentsInside === 'number' ? prevStats.studentsInside : 0;
        let totalSeats = typeof prevStats.totalSeats === 'number' ? prevStats.totalSeats : 150;

        // If Arduino/backend sends explicit counts, use them
        if (payload && typeof payload.studentsInside === 'number' && Number.isFinite(payload.studentsInside)) {
          studentsInside = payload.studentsInside;
        } else if (payload) {
          // Otherwise infer from event status or eventType
          const status = ((payload.status || payload.eventType || payload.event || '') + '').toString().toLowerCase();
          if (status.includes('entry') || status.includes('entered')) {
            studentsInside = Math.max(0, studentsInside + 1);
          } else if (status.includes('exit') || status.includes('exited')) {
            studentsInside = Math.max(0, studentsInside - 1);
          }
        }

        // Allow backend to override total seats if provided
        if (payload && typeof payload.totalSeats === 'number' && Number.isFinite(payload.totalSeats)) {
          totalSeats = payload.totalSeats;
        }

        const availableSeats = Math.max(0, totalSeats - studentsInside);

        const newStats = {
          ...prevStats,
          studentsInside,
          totalSeats,
          availableSeats
        };

        console.log('✓ Safe stats updated:', newStats);
        return newStats;
      });
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    socket.on('disconnect', () => {
      console.log('⚠️ Disconnected from Socket.IO');
    });

    // Fetch initial data
    const fetchData = async () => {
      try {
        // Fetch dashboard stats
        const statsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        setStats(statsResponse.data);

        // Fetch daily stats
        const dailyStatsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/logs/daily`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        setDailyStats(dailyStatsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);

        // Provide safe fallback so UI stays populated
        setStats({
          studentsInside: 0,
          totalStudents: 50,
          totalBooks: 1500,
          availableBooks: 1350,
          borrowedBooks: 150,
          totalSeats: 150,
          availableSeats: 149
        });

        const sampleDailyStats = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          entries: Math.floor(Math.random() * 10),
          exits: Math.floor(Math.random() * 8)
        }));
        setDailyStats(sampleDailyStats);

        setLoading(false);
      }
    };

    fetchData();

    // Clean up socket connection
    return () => {
      socket.disconnect();
    };
  }, []);

  // For demo purposes, generate sample data if API endpoints are not available
  useEffect(() => {
    if (loading) {
      // Sample stats
      setStats({
        studentsInside: 1,
        totalStudents: 50,
        totalBooks: 1500,
        availableBooks: 1350,
        borrowedBooks: 150
      });

      // Sample daily stats
      const sampleDailyStats = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        entries: Math.floor(Math.random() * 10),
        exits: Math.floor(Math.random() * 8)
      }));

      setDailyStats(sampleDailyStats);

      setLoading(false);
    }
  }, [loading]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="font-bold text-white">{`Hour: ${label}:00`}</p>
          <p className="text-green-400">{`Entries: ${payload[0].value}`}</p>
          <p className="text-red-400">{`Exits: ${payload[1].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 transition-colors duration-300`}>
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-lg shadow-lg py-4 px-6 flex justify-between items-center border-b border-gray-700">
        <motion.h1
          className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          BPIT Library Dashboard
        </motion.h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
        >
          {darkMode ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
        </button>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard
            title="Students Inside"
            value={Number.isFinite(stats.studentsInside) ? stats.studentsInside : 0}
            icon={FiUserCheck}
            color="#6366f1"
            delay={0.1}
            subtitle={`${occupancyPct}% occupancy`}
            trend={12}
          />
          <StatCard
            title="Total Seats"
            value={Number.isFinite(stats.totalSeats) ? stats.totalSeats : 0}
            icon={FiUsers}
            color="#10b981"
            delay={0.2}
          />
          <StatCard
            title="Available Seats"
            value={Number.isFinite(stats.availableSeats) ? stats.availableSeats : 0}
            icon={FiClock}
            color="#f59e0b"
            delay={0.25}
          />
          <StatCard
            title="Total Books"
            value={stats.totalBooks}
            icon={FiBook}
            color="#ec4899"
            delay={0.3}
            trend={5}
          />
          <StatCard
            title="Available Books"
            value={stats.availableBooks}
            icon={FiBook}
            color="#f59e0b"
            delay={0.4}
          />
        </div>

        {/* First Row: Activity Chart and Due Date Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Daily Entry/Exit Chart */}
          <motion.div
            className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 md:p-6 border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 md:mb-6 flex items-center">
              <FiActivity className="mr-2 text-indigo-400" />
              Today's Activity
            </h2>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis
                    dataKey="hour"
                    stroke="#9ca3af"
                    tick={{ fill: '#d1d5db' }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    tick={{ fill: '#d1d5db' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="entries"
                    name="Entries"
                    fill="#4ade80"
                    radius={[4, 4, 0, 0]}
                    animationDuration={2000}
                  />
                  <Bar
                    dataKey="exits"
                    name="Exits"
                    fill="#f87171"
                    radius={[4, 4, 0, 0]}
                    animationDuration={2000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Due Date Alerts */}
          <DueDateAlerts />
        </div>

        {/* Second Row: Book Discovery and Reading Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Book Discovery Section */}
          <BookDiscovery />

          {/* Reading Statistics */}
          <ReadingStatistics />
        </div>

        {/* Live Status Indicator */}
        <motion.div
          className="mt-6 md:mt-8 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center bg-gray-800/50 backdrop-blur-lg rounded-full px-4 py-2 shadow-lg border border-gray-700">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="text-sm text-gray-300">Live updates active</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
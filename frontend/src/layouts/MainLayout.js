import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import collegeLogo from '../bpit.jpeg'; // Updated path to logo

// Icon Components (unchanged)
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const StudentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
  </svg>
);

const BooksIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
  </svg>
);

const LogsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

// MainLayout component
const MainLayout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentDay, setCurrentDay] = useState('');

  useEffect(() => {
    const socketHost = (process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/api$/, '');
    const socket = io(socketHost);
    socket.on('scan', (data) => {
      const id = data?.student?.rollNo || data?.log?.student?.rollNo || data?.student?.rfidUID || data?.log?.student?.rfidUID || data?.student?._id || data?.log?.student?._id;
      if (id) {
        navigate(`/students/${id}`);
      }
    });
    return () => socket.disconnect();
  }, [navigate]);

  // Live clock for header date/time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
      setCurrentDate(now.toLocaleDateString());
      setCurrentDay(now.toLocaleDateString(undefined, { weekday: 'long' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const isActive = (path) => {
    return location.pathname === path
      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg'
      : 'text-gray-300 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white';
  };

  useEffect(() => {
    const socketHost = (process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/api$/, '');
    const socket = io(socketHost);
    socket.on('scan', (data) => {
      const id = data?.student?.rollNo || data?.log?.student?.rollNo || data?.student?.rfidUID || data?.log?.student?.rfidUID || data?.student?._id || data?.log?.student?._id;
      if (id) {
        navigate(`/students/${id}`);
      }
    });
    return () => socket.disconnect();
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl`}>
        {/* Logo and Title */}
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1 rounded-lg">
                <img
                  src={collegeLogo}
                  alt="College Logo"
                  className="w-10 h-10 rounded-md object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">College Library</h1>
                <p className="text-xs text-gray-400">Management System</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <div className="bg-white p-1 rounded-lg">
                <img
                  src={collegeLogo}
                  alt="College Logo"
                  className="w-8 h-8 rounded-md object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 overflow-y-auto">
          <Link to="/" className={`flex items-center px-4 py-3 mb-1 mx-2 rounded-lg transition-all duration-200 ${isActive('/')}`}>
            <DashboardIcon />
            {sidebarOpen && <span className="ml-3 font-medium">Dashboard</span>}
          </Link>
          <Link to="/students" className={`flex items-center px-4 py-3 mb-1 mx-2 rounded-lg transition-all duration-200 ${isActive('/students')}`}>
            <StudentsIcon />
            {sidebarOpen && <span className="ml-3 font-medium">Students</span>}
          </Link>
          <Link to="/books" className={`flex items-center px-4 py-3 mb-1 mx-2 rounded-lg transition-all duration-200 ${isActive('/books')}`}>
            <BooksIcon />
            {sidebarOpen && <span className="ml-3 font-medium">Books</span>}
          </Link>
          <Link to="/logs" className={`flex items-center px-4 py-3 mb-1 mx-2 rounded-lg transition-all duration-200 ${isActive('/logs')}`}>
            <LogsIcon />
            {sidebarOpen && <span className="ml-3 font-medium">Logs</span>}
          </Link>
          <Link to="/settings" className={`flex items-center px-4 py-3 mb-1 mx-2 rounded-lg transition-all duration-200 ${isActive('/settings')}`}>
            <SettingsIcon />
            {sidebarOpen && <span className="ml-3 font-medium">Settings</span>}
          </Link>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen ? (
            <div className="flex items-center">
              <div className="mr-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="ml-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold mb-2">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden mr-4 p-2 rounded-lg hover:bg-gray-700/50 text-gray-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={collegeLogo}
                  alt="College Logo"
                  className="h-10 w-10 rounded-lg object-contain bg-white p-1 shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                  }}
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white capitalize">
                  {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
                </h2>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span id="current-time">{currentTime || 'Loading...'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Date and Time Display */}
            <div className="hidden md:flex flex-col items-end">
              <div className="text-sm font-medium text-white" id="current-date">
                {currentDate || 'Loading...'}
              </div>
              <div className="text-xs text-gray-400" id="current-day">
                {currentDay || 'Loading...'}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-40 md:w-64"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative p-2 rounded-full hover:bg-gray-700/50 text-gray-300 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                  {user?.role}
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6 bg-gradient-to-b from-gray-800 to-gray-900 min-h-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
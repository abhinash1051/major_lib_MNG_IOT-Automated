import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'entry', 'exit'
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLogs();

    // Connect to Socket.IO for real-time updates
    const socket = io((process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/api$/, ''));
    socket.on('scan', (data) => {
      // Backend may send { log: {...} } or the normalized scan object directly
      const incoming = data.log ? data.log : data;

      // Normalize into the frontend log shape
      const student = {
        _id: incoming.enrollmentNumber || incoming.uid || `uid-${Date.now()}`,
        name: incoming.name || incoming.uid || 'Unknown',
        rollNo: incoming.enrollmentNumber || incoming.uid || '',
        photo: incoming.photo || ''
      };

      const logItem = {
        _id: `${student._id}-${Date.now()}`,
        timestamp: incoming.timestamp ? new Date(incoming.timestamp).toISOString() : new Date().toISOString(),
        eventType: incoming.eventType || (incoming.status === 'ENTRY' ? 'entry' : (incoming.status === 'EXIT' ? 'exit' : 'entry')),
        student,
        source: incoming.source || 'RFID',
        timeIn: incoming.timeIn,
        timeOut: incoming.timeOut,
        uid: incoming.uid,
        department: incoming.department,
        year: incoming.year,
        status: incoming.status,
        authorized: incoming.authorized
      };

      setLogs(prevLogs => {
        const next = [logItem, ...prevLogs];

        // Persist the log to backend so entries stick across reloads/navigation
        (async () => {
          try {
            await axios.post(`${process.env.REACT_APP_API_URL}/logs`, logItem, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
          } catch (e) {
            console.warn('Failed to persist incoming log to backend:', e && e.message ? e.message : e);
          }
        })();

        return next.slice(0, 1000); // keep a reasonable limit
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLoading(false);

      // For demo purposes, set sample data
      const sampleLogs = Array.from({ length: 20 }, (_, i) => ({
        _id: `log${i}`,
        timestamp: new Date(Date.now() - i * 3600000), // Each log 1 hour apart
        eventType: i % 2 === 0 ? 'entry' : 'exit',
        student: {
          _id: `student${i % 5}`,
          name: `Student ${i % 5}`,
          rollNo: `CS2021${String(i % 5).padStart(3, '0')}`,
          photo: ''
        },
        source: i % 3 === 0 ? 'ESP32_ENTRANCE' : 'ESP32_EXIT'
      }));

      setLogs(sampleLogs);
    }
  };

  const handleDateRangeChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const handleExport = async () => {
    try {
      // Build query parameters
      let queryParams = new URLSearchParams();

      if (dateRange.startDate) {
        queryParams.append('startDate', dateRange.startDate);
      }

      if (dateRange.endDate) {
        queryParams.append('endDate', dateRange.endDate);
      }

      if (filter !== 'all') {
        queryParams.append('eventType', filter);
      }

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/logs/export?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'logs.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Error exporting logs');
    }
  };

  // Filter logs based on search term, event type, and date range
  const filteredLogs = logs.filter(log => {
    // Filter by search term (student name or roll number)
    const matchesSearch =
      log.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by event type
    const matchesEventType = filter === 'all' || log.eventType === filter;

    // Filter by date range
    const logDate = new Date(log.timestamp);
    const matchesStartDate = !dateRange.startDate || logDate >= new Date(dateRange.startDate);
    const matchesEndDate = !dateRange.endDate || logDate <= new Date(`${dateRange.endDate}T23:59:59`);

    return matchesSearch && matchesEventType && matchesStartDate && matchesEndDate;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Entry/Exit Logs</h1>
        <button onClick={handleExport} className="btn-secondary">
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label htmlFor="search">Search</label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or roll number"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="filter">Event Type</label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Events</option>
              <option value="entry">Entry Only</option>
              <option value="exit">Exit Only</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">No logs found</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.student.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.uid || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.student.rollNo || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.department || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.year || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.timeIn || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.timeOut || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'ENTRY' ? 'bg-blue-100 text-blue-800' :
                      log.status === 'EXIT' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {log.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.eventType === 'entry' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {log.eventType === 'entry' ? 'Entry' : 'Exit'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.source}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
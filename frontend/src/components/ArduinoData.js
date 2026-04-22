import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const ArduinoData = () => {
  const [data, setData] = useState('');

  useEffect(() => {
    const socket = io((process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/api$/, ''));

    socket.on('arduino:data', (data) => {
      setData(data.data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Real-time Data from Arduino</h2>
      <p className="text-gray-700">{data}</p>
    </div>
  );
};

export default ArduinoData;
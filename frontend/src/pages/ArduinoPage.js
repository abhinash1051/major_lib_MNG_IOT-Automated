import React from 'react';
import ArduinoData from '../components/ArduinoData';

const ArduinoPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Arduino Real-time Data</h1>
      <ArduinoData />
    </div>
  );
};

export default ArduinoPage;
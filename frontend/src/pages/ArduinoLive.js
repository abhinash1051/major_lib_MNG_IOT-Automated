import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const ArduinoLive = () => {
    const [connected, setConnected] = useState(false);
    const [studentsInside, setStudentsInside] = useState(undefined);
    const [totalSeats, setTotalSeats] = useState(undefined);
    const [availableSeats, setAvailableSeats] = useState(undefined);
    const [recentScans, setRecentScans] = useState([]);

    useEffect(() => {
        const base = (process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/api$/, '');
        const socket = io(base);

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        socket.on('scan', (data) => {
            // Data shape normalized by backend
            setStudentsInside(prev => (data.studentsInside !== undefined ? data.studentsInside : prev));
            setTotalSeats(prev => (data.totalSeats !== undefined ? data.totalSeats : prev));
            setAvailableSeats(prev => (data.availableSeats !== undefined ? data.availableSeats : prev));

            setRecentScans(prev => {
                const next = [data, ...prev];
                return next.slice(0, 20);
            });
        });

        return () => socket.disconnect();
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Arduino Live Dashboard</h1>
            <p>Status: <strong>{connected ? 'Connected' : 'Disconnected'}</strong></p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div className="p-4 bg-white rounded shadow">
                    <div className="text-sm text-gray-500">Students Inside</div>
                    <div className="text-3xl font-bold">{studentsInside !== undefined ? studentsInside : '-'}</div>
                </div>
                <div className="p-4 bg-white rounded shadow">
                    <div className="text-sm text-gray-500">Total Seats</div>
                    <div className="text-3xl font-bold">{totalSeats !== undefined ? totalSeats : '-'}</div>
                </div>
                <div className="p-4 bg-white rounded shadow">
                    <div className="text-sm text-gray-500">Available Seats</div>
                    <div className="text-3xl font-bold">{availableSeats !== undefined ? availableSeats : '-'}</div>
                </div>
            </div>

            <div className="bg-white rounded shadow p-4">
                <h2 className="font-semibold mb-2">Recent Scans</h2>
                <div className="divide-y">
                    {recentScans.length === 0 && <div className="text-sm text-gray-500">No scans yet</div>}
                    {recentScans.map((s, idx) => (
                        <div key={idx} className="py-2 flex justify-between text-sm">
                            <div>
                                <div className="font-medium">{s.name || s.uid || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{s.enrollmentNumber || ''} • {s.department || ''}</div>
                            </div>
                            <div className="text-right text-xs text-gray-600">
                                <div>{s.eventType || s.status || ''}</div>
                                <div>{s.timeIn || ''}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ArduinoLive;

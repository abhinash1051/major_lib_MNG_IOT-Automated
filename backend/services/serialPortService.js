// backend/services/serialPortService.js
// Listens to Arduino RFID scanner via Serial and emits to Socket.IO

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let port;
let parser;
let io;

const initSerialPort = (socketIO, portName = 'COM3', baudRate = 9600) => {
    io = socketIO;

    try {
        port = new SerialPort({
            path: portName,
            baudRate: Number(baudRate),
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            autoOpen: true
        });

        // Use the ReadlineParser from @serialport/parser-readline
        parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

        port.on('open', () => {
            console.log(`✓ Serial port connected on ${portName} at ${baudRate} baud`);
        });

        parser.on('data', (line) => {
            const raw = line.trim();
            // Try JSON first, then fallback to CSV / simple formats
            let data = null;
            try {
                data = JSON.parse(raw);
                console.log('📱 RFID JSON detected:', data);
            } catch (jsonErr) {
                // Try to parse CSV-like fallback (name,enrollment,department,year,timeIn,timeOut,status)
                try {
                    const parts = raw.split(',').map(s => s.trim());
                    // If first part looks like header, skip
                    if (parts.length >= 5 && /name/i.test(parts[0]) && /enroll/i.test(parts[1])) {
                        console.log('ℹ️ Ignoring header line from Arduino:', raw);
                        return;
                    }

                    // Build a best-effort object
                    data = {
                        uid: parts[0] && parts[0].length > 8 ? parts[0] : undefined,
                        name: parts[0] && parts.length >= 5 ? parts[0] : undefined,
                        enrollmentNumber: parts[1] || undefined,
                        department: parts[2] || undefined,
                        year: parts[3] || undefined,
                        timeIn: parts[4] || undefined,
                        timeOut: parts[5] || undefined,
                        status: (parts[6] && parts[6].toUpperCase().startsWith('ENT')) ? 'ENTRY' : ((parts[6] && parts[6].toUpperCase().startsWith('EX')) ? 'EXIT' : undefined),
                        // If Arduino didn't send counts, keep undefined
                        studentsInside: undefined,
                        totalSeats: undefined,
                        authorized: true
                    };

                    console.log('📱 Parsed CSV-like line into object:', data);
                } catch (csvErr) {
                    console.error('❌ Failed to parse RFID data as JSON or CSV:', raw, csvErr.message || csvErr);
                    return;
                }
            }

            // Normalize and compute fields to broadcast
            try {
                const studentsInside = (data.studentsInside !== undefined && data.studentsInside !== null) ? Number(data.studentsInside) : undefined;
                const totalSeats = (data.totalSeats !== undefined && data.totalSeats !== null) ? Number(data.totalSeats) : undefined;

                const scanData = {
                    uid: data.uid,
                    name: data.name,
                    enrollmentNumber: data.enrollmentNumber || data.rfidUID,
                    department: data.department,
                    year: data.year,
                    eventType: data.status === 'ENTRY' ? 'entry' : (data.status === 'EXIT' ? 'exit' : undefined),
                    status: data.status,
                    authorized: data.authorized !== undefined ? data.authorized : true,
                    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                    timeIn: data.timeIn,
                    timeOut: data.timeOut,
                    studentsInside: studentsInside,
                    totalSeats: totalSeats,
                    availableSeats: (typeof studentsInside === 'number' && typeof totalSeats === 'number') ? Math.max(0, totalSeats - studentsInside) : undefined
                };

                console.log('✓ Broadcasting scan event:', JSON.stringify(scanData, null, 2));
                io.emit('scan', scanData);
            } catch (finalErr) {
                console.error('❌ Failed to normalize/broadcast scan data:', raw, finalErr.message || finalErr);
            }
        });

        port.on('error', (err) => {
            console.error('❌ Serial port error:', err && err.message ? err.message : err);
            if (err && /access denied/i.test(err.message || '')) {
                console.error('🔒 Access denied opening serial port. Make sure the Arduino IDE Serial Monitor or another program is NOT open on the same COM port (e.g. COM18).');
                console.error('🔧 On Windows: close Serial Monitor, unplug/replug the device, or run this process as Administrator.');
            }
        });

        port.on('close', () => {
            console.log('⚠️ Serial port closed');
        });
    } catch (err) {
        console.error('❌ Failed to initialize serial port:', err && err.message ? err.message : err);
        console.error(err && err.stack ? err.stack : 'No stack available');
        if (err && /access denied/i.test(err.message || '')) {
            console.error('🔒 Access denied opening serial port. Make sure the Arduino IDE Serial Monitor or another program is NOT open on the same COM port (e.g. COM18).');
            console.error('🔧 On Windows: close Serial Monitor, unplug/replug the device, or run this process as Administrator.');
        }
    }
};

const closeSerialPort = () => {
    if (port && port.isOpen) {
        port.close();
    }
};

module.exports = {
    initSerialPort,
    closeSerialPort
};

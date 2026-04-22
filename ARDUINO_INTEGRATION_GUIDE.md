# Arduino RFID Integration Setup Guide

## Overview
This guide explains how to integrate your Arduino RFID scanner with the library management system for real-time student tracking and automatic profile display.

---

## Prerequisites
- Arduino IDE installed
- Node.js and npm installed
- MongoDB running (local or cloud)
- USB cable to connect Arduino to PC
- Serial port libraries installed

---

## Step 1: Arduino Setup

### Install Required Libraries in Arduino IDE
1. Open Arduino IDE
2. Go to **Sketch > Include Library > Manage Libraries**
3. Search and install:
   - **ArduinoJson** (by Benoit Blanchon) - for JSON serialization
   - **MFRC522** (by GithubCommunity) - for RFID reading
   - **LiquidCrystal_I2C** (by Frank de Brabander) - for LCD display

### Upload the Modified Sketch
1. Copy the updated Arduino code from: `esp32/rfid_scanner_realtime.ino`
2. Open Arduino IDE and paste the code
3. Select your Arduino board: **Tools > Board > Arduino/Genuino Mega 2560** (or your board type)
4. Select COM port: **Tools > Port > COM3** (or your port)
5. Click **Upload**

### Verify Upload
- Open **Tools > Serial Monitor**
- Set baud rate to **9600**
- Tap an RFID card to verify JSON output appears in the monitor
- Example output:
```json
{"uid":"04b4902a9f1c90","name":"Shruti","enrollmentNumber":"E-1004","department":"CSE","year":"2nd","timeIn":"12:55:50","timeOut":"-","status":"ENTRY","authorized":true,"timestamp":"12:55:50"}
```

---

## Step 2: Backend Setup

### Install Dependencies
```bash
cd backend
npm install
npm install @serialport/parser-readline
```

### Configure Environment Variables
Edit `backend/.env`:
```env
PORT=8000
ARDUINO_PORT=COM3              # Windows: COM3, Linux/Mac: /dev/ttyUSB0
ARDUINO_BAUD=9600

MONGODB_URL=mongodb+srv://...  # Your MongoDB connection string
JWT_SECRET=1234
```

### Update Student Data
Students in the Arduino sketch must match your database. Update `esp32/rfid_scanner_realtime.ino`:
```cpp
UserData userList[] = {
  {"04b4902a9f1c90", "Shruti", "E-1004", "04b4902a9f1c90", "CSE", "2nd", "", false},
  {"c340f27", "Abhinesh Kumar", "0322", "c340f27", "CSE", "2nd", "", false},
  // Add more students...
};
```

### Start Backend Server
```bash
npm start
```

Expected output:
```
✓ Serial port connected on COM3 at 9600 baud
Server running on port 8000
```

---

## Step 3: Frontend Setup

### Update Environment Variables
Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_SOCKET_URL=http://localhost:8000
```

### Start Frontend
```bash
cd frontend
npm start
```

---

## Step 4: Test Real-Time Integration

### Test Flow
1. **Login** to the application with your credentials
2. **Navigate to Dashboard** to see real-time updates
3. **Tap an RFID card** on the Arduino scanner
   - LCD displays student name and status
   - Buzzer beeps (green LED for authorized, red for unauthorized)
   - Backend receives JSON via serial and emits Socket.IO event
   - Dashboard updates with new scan data
4. **Tap the same card again** to log exit
   - Status changes to "EXIT" / "LOGGED OUT"
   - Student count updates in real time

### Auto-Navigate to Student Profile
- When a valid RFID card is scanned, the frontend will **automatically navigate** to that student's profile
- Student's borrowing history, current books, and overdue status are displayed

---

## Step 5: Troubleshooting

### Serial Port Connection Issues
```bash
# List available COM ports (Windows)
wmic logicaldisk where name="COM*" list

# List available ports (Linux)
ls /dev/tty*

# Update .env with correct port
ARDUINO_PORT=COM5  # or /dev/ttyUSB0
```

### No Data Appearing in Serial Monitor
- Check USB cable connection
- Verify baud rate is **9600**
- Ensure MFRC522 library is installed
- Check RFID module wiring (SPI pins: 10, 11, 12, 13)

### Socket.IO Connection Timeout
- Ensure backend is running: `npm start` in backend folder
- Check firewall isn't blocking port 8000
- Verify `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` in frontend `.env`

### Student Data Not Updating
- Ensure student RFID UID matches in Arduino `userList[]`
- Check MongoDB connection string in `backend/.env`
- Verify enrollment number or ID matches in database

---

## Hardware Pinout Reference

```
Arduino Mega 2560 to MFRC522:
- Pin 10  → SPI Slave Select (SS)
- Pin 11  → SPI MOSI
- Pin 12  → SPI MISO
- Pin 13  → SPI Clock (SCK)
- Pin 9   → Reset (RST)
- GND     → GND
- 5V      → 5V

LEDs and Buzzer:
- Pin 5   → Green LED (Access Granted)
- Pin 4   → Red LED (Unauthorized)
- Pin 2   → Buzzer

LCD I2C (16x2):
- SDA → 20 (on Mega)
- SCL → 21 (on Mega)
- 5V  → 5V
- GND → GND
```

---

## JSON Serial Protocol

### Request (Arduino to Backend)
```json
{
  "uid": "04b4902a9f1c90",
  "name": "Shruti",
  "enrollmentNumber": "E-1004",
  "department": "CSE",
  "year": "2nd",
  "timeIn": "12:55:50",
  "timeOut": "-",
  "status": "ENTRY",
  "authorized": true,
  "timestamp": "12:55:50"
}
```

### Socket.IO Event (Backend to Frontend)
```javascript
socket.on('scan', {
  uid: "04b4902a9f1c90",
  name: "Shruti",
  enrollmentNumber: "E-1004",
  department: "CSE",
  year: "2nd",
  eventType: "entry",          // 'entry' or 'exit'
  status: "ENTRY",
  authorized: true,
  timestamp: "2025-11-21T12:55:50Z",
  timeIn: "12:55:50",
  timeOut: "-"
});
```

---

## Next Steps

1. **Add more student cards** to the Arduino sketch
2. **Calibrate LCD contrast** if display is unclear
3. **Test with actual RFID cards** from your institution
4. **Set up automated backups** of scan logs
5. **Configure fine/penalty system** for overdue books

---

## Support

For issues or questions:
- Check serial monitor output for raw RFID data
- Verify all connections are secure
- Restart backend and frontend if data stops flowing
- Check browser console for Socket.IO errors (F12 > Console)

---

**Last Updated:** November 21, 2025

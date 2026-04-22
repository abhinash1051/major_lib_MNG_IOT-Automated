# 🎯 Complete Arduino Connection & Run Guide

## 📋 Table of Contents
1. [Hardware Setup](#1-hardware-setup)
2. [Arduino Code Upload](#2-arduino-code-upload)
3. [Backend Setup](#3-backend-setup)
4. [Frontend Setup](#4-frontend-setup)
5. [Run Everything](#5-run-everything)
6. [Test the System](#6-test-the-system)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Hardware Setup

### What You Need
- Arduino Mega 2560 (or similar)
- MFRC522 RFID Module
- 16x2 LCD Display with I2C Module
- Green LED, Red LED
- Buzzer
- USB Cable (Arduino to PC)
- Jumper wires and breadboard

### Arduino to MFRC522 Connections
```
MFRC522 PIN          Arduino Mega 2560 PIN
===================================
SDA (or MOSI)   →    Pin 11 (SPI MOSI)
SCK             →    Pin 13 (SPI Clock)
MISO            →    Pin 12 (SPI MISO)
IRQ             →    (not used - skip)
GND             →    GND
RST             →    Pin 9
SS (or SPI)     →    Pin 10
3V3             →    3.3V (NOT 5V!)
```

### Arduino to LCD I2C Connections
```
LCD I2C PIN         Arduino Mega 2560 PIN
===================================
SDA             →    Pin 20 (SDA)
SCL             →    Pin 21 (SCL)
GND             →    GND
VCC             →    5V
```

### Arduino to LEDs & Buzzer
```
COMPONENT       Arduino Mega PIN
===================================
Green LED       →    Pin 5
Red LED         →    Pin 4
Buzzer          →    Pin 2
All GND pins    →    GND (via resistors for LEDs)
```

### Wiring Diagram Summary
```
┌─────────────────────────────────────────┐
│   Arduino Mega 2560 (Top View)          │
│                                         │
│  SPI (Back):                            │
│  • Pin 13 → MFRC522 SCK                 │
│  • Pin 12 ← MFRC522 MISO                │
│  • Pin 11 → MFRC522 MOSI                │
│  • Pin 10 → MFRC522 SS                  │
│                                         │
│  I2C (Side):                            │
│  • Pin 20 ← LCD SDA                     │
│  • Pin 21 ← LCD SCL                     │
│                                         │
│  Control Pins:                          │
│  • Pin 9  → MFRC522 RST                 │
│  • Pin 5  → Green LED (+5V side)        │
│  • Pin 4  → Red LED (+5V side)          │
│  • Pin 2  → Buzzer (+5V side)           │
│                                         │
│  Power:                                 │
│  • GND → MFRC522 GND, LCD GND           │
│  • 5V → LCD VCC, LED resistors, Buzzer │
│  • 3.3V → MFRC522 VCC                   │
└─────────────────────────────────────────┘
```

---

## 2. Arduino Code Upload

### Step 1: Install Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Install on your PC

### Step 2: Install Required Libraries
1. Open **Arduino IDE**
2. Click **Sketch** → **Include Library** → **Manage Libraries**
3. Search and install these (one by one):

   **a) ArduinoJson**
   - Search: `ArduinoJson`
   - Author: Benoit Blanchon
   - Click **Install**

   **b) MFRC522**
   - Search: `MFRC522`
   - Author: GithubCommunity
   - Click **Install**

   **c) LiquidCrystal_I2C**
   - Search: `LiquidCrystal I2C`
   - Author: Frank de Brabander
   - Click **Install**

### Step 3: Find Your Arduino Code
- Open File Explorer
- Navigate to: `D:\All Project\library-mangement\esp32`
- Find: `rfid_scanner_realtime.ino`
- Right-click → Open with Arduino IDE

### Step 4: Select Board & COM Port
1. In Arduino IDE, click **Tools**
2. **Board:** Select → **Arduino Mega 2560**
3. **Port:** Select → **COM18** (or the port showing your Arduino)

   💡 *Tip: If COM18 is not showing:*
   - Reconnect USB cable
   - Wait 5 seconds
   - Go to Tools → Port again
   - Should see COM port now

### Step 5: Upload Code
1. Check connections again (all wires connected properly)
2. Click **Upload** button (arrow icon, right side)
3. Wait 30 seconds for upload to complete
4. Should see: ✓ "Done uploading"

### Step 6: Test Upload
1. Click **Tools** → **Serial Monitor**
2. Set baud rate to **9600** (bottom right dropdown)
3. Tap an RFID card near the MFRC522 module
4. Should see JSON output like:
   ```json
   {"uid":"04b4902a9f1c90","name":"Shruti","enrollmentNumber":"E-1004",...}
   ```

✅ **If you see JSON output, Arduino is working!**

---

## 3. Backend Setup

### Step 1: Open Terminal in Backend Folder
1. Press **Windows Key + R**
2. Type: `cmd`
3. Click **OK**
4. Copy-paste this command:
   ```bash
   cd D:\All Project\library-mangement\backend
   ```

### Step 2: Install Node Packages
```bash
npm install
```
Wait for it to finish (2-3 minutes)

### Step 3: Check Arduino Port
1. Press **Windows Key + R**
2. Type: `devmgmt.msc`
3. Click **OK**
4. Expand **Ports (COM & LPT)**
5. Find your Arduino (e.g., **COM18**)
6. Remember this port number

### Step 4: Update .env File
1. Open: `D:\All Project\library-mangement\backend\.env`
2. Find line: `ARDUINO_PORT=COM18`
3. Change **COM18** to your actual Arduino port
4. Save file (Ctrl + S)

Example:
```
PORT=8000
ARDUINO_PORT=COM3          ← Change this to your port
ARDUINO_BAUD=9600
MONGODB_URL=mongodb+srv://...
JWT_SECRET=1234
```

### Step 5: Start Backend Server
In same terminal window, type:
```bash
npm start
```

**Expected Output:**
```
✓ Serial port connected on COM18 at 9600 baud
Server running on port 8000
MongoDB connected successfully
```

✅ **If you see this, Backend is working!**

💡 **Keep this terminal open!** (Don't close it)

---

## 4. Frontend Setup

### Step 1: Open New Terminal Window
1. Press **Windows Key + R**
2. Type: `cmd`
3. Click **OK**
4. Navigate to frontend:
   ```bash
   cd D:\All Project\library-mangement\frontend
   ```

### Step 2: Start Frontend
```bash
npm start
```

**Expected Output:**
```
webpack compiled successfully
Compiled successfully!
You can now view library-management in the browser.
  Local:            http://localhost:3000
```

✅ **If you see this, Frontend is working!**

💡 **Keep this terminal open too!** (Don't close it)

---

## 5. Run Everything (Full Checklist)

### Terminal 1: Backend ✓
```
Status: ✓ Running on port 8000
Status: ✓ Serial connected to COM18
Status: ✓ MongoDB connected
```

### Terminal 2: Frontend ✓
```
Status: ✓ Running on port 3000
Status: ✓ Open: http://localhost:3000
```

### Arduino ✓
```
Status: ✓ Connected via USB (COM18)
Status: ✓ Code uploaded
Status: ✓ Sending RFID data
```

### Browser ✓
```
Action: Open http://localhost:3000
Action: Login with your credentials
Action: Wait for dashboard to load
```

---

## 6. Test the System

### Test Step 1: Check Dashboard
1. Open browser: `http://localhost:3000`
2. Login with your credentials
3. Go to **Dashboard**
4. Should see:
   - Students Inside count
   - Total Students
   - Today's Activity chart
   - Real-time updates section

### Test Step 2: Tap RFID Card
1. Keep browser on Dashboard
2. Hold RFID card near MFRC522 module
3. Watch for:
   - ✓ Green LED lights up
   - ✓ Buzzer beeps (short)
   - ✓ LCD shows student name + "AUTHORIZED"
   - ✓ Dashboard updates with new scan
   - ✓ Recent scans table shows entry

### Test Step 3: Tap Same Card Again
1. Tap the same card again
2. Watch for:
   - ✓ Green LED lights up
   - ✓ Buzzer beeps
   - ✓ LCD shows student name + "LOGGED OUT"
   - ✓ Students Inside count decreases
   - ✓ Exit event recorded

### Test Step 4: Auto Profile Navigation
1. Open **Students** page
2. Click on a student to view profile
3. Tap that student's RFID card
4. **Should auto-navigate to student profile!**
5. See:
   - ✓ Student info (name, roll, department)
   - ✓ Currently borrowed books
   - ✓ Borrowing history
   - ✓ Overdue books (if any)

### Test Step 5: Unknown Card
1. Tap an RFID card not in the system
2. Watch for:
   - ✓ Red LED lights up
   - ✓ Buzzer beeps (longer, lower tone)
   - ✓ LCD shows "UNAUTHORIZED ACCESS"
   - ✓ Dashboard shows "UNAUTHORIZED"

---

## 7. Troubleshooting

### ❌ Arduino Not Showing in Device Manager
**Problem:** COM port not visible
**Solution:**
1. Install Arduino drivers from: https://www.arduino.cc/en/Guide
2. Try different USB cable (might be charging only)
3. Restart computer
4. Try different USB port on PC

### ❌ Serial Port Error in Backend
**Error:** `Error: Cannot open COM18`
**Solution:**
1. Check Arduino is connected
2. Check port number in `.env` file
3. Make sure Arduino IDE is NOT open (closes serial port)
4. Restart backend: Stop (Ctrl+C) and run `npm start` again

### ❌ No JSON Output in Serial Monitor
**Problem:** Tapping card shows nothing
**Solution:**
1. Check MFRC522 wiring (especially power: 3.3V, not 5V!)
2. Check SPI pins: 10, 11, 12, 13 connected correctly
3. Check RFID card is compatible (check module manual)
4. Try different RFID card
5. Check antenna positioning

### ❌ LCD Shows Nothing
**Problem:** Blank LCD screen
**Solution:**
1. Check I2C address: In Arduino IDE, Serial Monitor, upload this:
   ```cpp
   #include <Wire.h>
   void setup() {
     Serial.begin(9600);
     Wire.begin();
     for(int i=8;i<120;i++){
       Wire.beginTransmission(i);
       if(Wire.endTransmission()==0){
         Serial.print("Found device at 0x");
         Serial.println(i,HEX);
       }
     }
   }
   void loop(){}
   ```
2. Note the address (usually 0x27 or 0x3F)
3. Update line in Arduino code:
   ```cpp
   LiquidCrystal_I2C lcd(0x27, 16, 2); // Change 0x27 if needed
   ```
4. Re-upload

### ❌ Frontend Won't Connect to Backend
**Error:** "Cannot reach API"
**Solution:**
1. Check backend is running (Terminal 1)
2. Check backend shows "Server running on port 8000"
3. Check `.env` in frontend:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_SOCKET_URL=http://localhost:8000
   ```
4. Restart frontend: Stop (Ctrl+C) and run `npm start` again

### ❌ MongoDB Connection Error
**Error:** "Cannot connect to MongoDB"
**Solution:**
1. Check internet connection (cloud MongoDB needs internet)
2. Check MongoDB URL in `.env` is correct
3. Check MongoDB IP whitelist includes your PC's IP
4. Try local MongoDB if available

### ❌ "Permission Denied" Error on Serial Port
**Problem:** Backend says "EACCES"
**Solution (Windows):**
1. Close Arduino IDE if open
2. Restart backend: `npm start`

**Solution (Linux/Mac):**
1. Add user to dialout group:
   ```bash
   sudo usermod -a -G dialout $USER
   ```
2. Restart terminal
3. Start backend

---

## 🎬 Quick Start Checklist

- [ ] Arduino wired correctly
- [ ] Libraries installed (ArduinoJson, MFRC522, LiquidCrystal_I2C)
- [ ] Code uploaded to Arduino
- [ ] JSON output visible in Serial Monitor
- [ ] Arduino port found (Device Manager)
- [ ] `.env` file updated with correct COM port
- [ ] Backend running (`npm start` in backend folder)
- [ ] Frontend running (`npm start` in frontend folder)
- [ ] Browser open at `http://localhost:3000`
- [ ] Logged in successfully
- [ ] RFID card tapped → Dashboard updates
- [ ] Student profile auto-loads on card tap ✓

---

## 📞 Need Help?

Check these files for more info:
- `ARDUINO_INTEGRATION_GUIDE.md` - Advanced setup
- `backend/services/serialPortService.js` - Serial port code
- `esp32/rfid_scanner_realtime.ino` - Arduino sketch

---

**Good luck! 🚀**

# ⚡ QUICK REFERENCE - Arduino & Run Steps

## 🔌 STEP 1: Physical Connection (5 minutes)

### What to Connect
```
Your PC (USB) ──────── USB Cable ──────── Arduino Mega 2560
                                          │
                                          ├─ Pin 9  ──→ MFRC522 RST
                                          ├─ Pin 10 ──→ MFRC522 SS
                                          ├─ Pin 11 ──→ MFRC522 MOSI
                                          ├─ Pin 12 ←── MFRC522 MISO
                                          ├─ Pin 13 ──→ MFRC522 SCK
                                          │
                                          ├─ Pin 20 ←── LCD SDA
                                          ├─ Pin 21 ──→ LCD SCL
                                          │
                                          ├─ Pin 2  ──→ Buzzer
                                          ├─ Pin 4  ──→ Red LED
                                          ├─ Pin 5  ──→ Green LED
                                          │
                                          ├─ GND ──→ MFRC522 GND
                                          ├─ GND ──→ LCD GND
                                          ├─ 3.3V ──→ MFRC522 VCC ⚠️ (NOT 5V!)
                                          └─ 5V ──→ LCD VCC
```

---

## 📱 STEP 2: Upload Arduino Code (5 minutes)

**Command by command:**

```bash
# 1. Download Arduino IDE
   Visit: https://www.arduino.cc/en/software

# 2. Open Arduino IDE
   → Sketch → Include Library → Manage Libraries

# 3. Install 3 Libraries (copy paste names)
   ✓ ArduinoJson (by Benoit Blanchon)
   ✓ MFRC522 (by GithubCommunity)
   ✓ LiquidCrystal_I2C (by Frank de Brabander)

# 4. Open this file in Arduino IDE:
   File → Open
   D:\All Project\library-mangement\esp32\rfid_scanner_realtime.ino

# 5. Select Your Arduino Board:
   Tools → Board → Arduino Mega 2560

# 6. Select Your COM Port:
   Tools → Port → COM18 (or your port)

# 7. Click Upload (play button icon)
   ⏳ Wait 30 seconds...
   ✓ Should see "Done uploading"
```

---

## 🖥️ STEP 3: Backend Setup & Run (3 minutes)

**Open PowerShell or CMD:**

```powershell
# Go to backend folder
cd D:\All Project\library-mangement\backend

# Install packages
npm install

# Check your Arduino COM port (remember this!)
# In Device Manager: Ports (COM & LPT) → Arduino (COM18)

# Update .env file
# Open: backend\.env
# Change: ARDUINO_PORT=COM18 (to your actual port)

# Start backend
npm start

# Expected output:
# ✓ Serial port connected on COM18 at 9600 baud
# ✓ Server running on port 8000
```

💡 **Keep this terminal OPEN!**

---

## 🌐 STEP 4: Frontend Setup & Run (2 minutes)

**Open NEW PowerShell or CMD:**

```powershell
# Go to frontend folder
cd D:\All Project\library-mangement\frontend

# Start frontend
npm start

# Expected output:
# ✓ webpack compiled successfully
# ✓ Open: http://localhost:3000
```

💡 **Keep this terminal OPEN too!**

---

## 🧪 STEP 5: Test It! (1 minute)

```
✓ Open browser: http://localhost:3000
✓ Login with your credentials
✓ Go to Dashboard
✓ TAP RFID CARD near MFRC522 module
   - Green LED should light
   - Buzzer should beep
   - LCD shows student name
   - Dashboard updates with scan data
✓ Tap same card again (exit)
   - Student count decreases
✓ Go to Students page
✓ TAP CARD on any student
   - AUTO-NAVIGATE to their profile!
   - Shows borrowing history
```

---

## 📊 Running State Checklist

### ✓ All 3 Things Running?

```
┌──────────────────────────────────────────────┐
│ TERMINAL 1: Backend                          │
├──────────────────────────────────────────────┤
│ > npm start                                  │
│ ✓ Serial port connected on COM18             │
│ ✓ Server running on port 8000                │
│ ✓ MongoDB connected                          │
│ (Status: GREEN - Running)                    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ TERMINAL 2: Frontend                         │
├──────────────────────────────────────────────┤
│ > npm start                                  │
│ ✓ webpack compiled successfully              │
│ ✓ Open: http://localhost:3000                │
│ (Status: GREEN - Running)                    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ HARDWARE: Arduino + RFID                     │
├──────────────────────────────────────────────┤
│ ✓ USB connected (COM18)                      │
│ ✓ Code uploaded                              │
│ ✓ Ready to scan cards                        │
│ (Status: GREEN - Ready)                      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ BROWSER                                      │
├──────────────────────────────────────────────┤
│ ✓ http://localhost:3000 (open)               │
│ ✓ Dashboard showing (student count > 0)      │
│ ✓ Real-time updates working                  │
│ (Status: GREEN - Working)                    │
└──────────────────────────────────────────────┘
```

---

## ❌ Quick Fixes

| Problem | Solution |
|---------|----------|
| COM port not found | Restart PC, try different USB cable, install drivers |
| "Serial port cannot open" | Close Arduino IDE, restart backend |
| No LCD display | Check I2C address (0x27 or 0x3F), check wiring |
| Backend won't start | Check `.env` file, check MongoDB URL |
| Frontend won't load | Backend must be running first |
| Card tap shows nothing | Check MFRC522 wiring, use 3.3V not 5V |
| No green/red LED | Check LED polarity, use resistors |

---

## 🎯 Command Reference

### To Stop Everything
```bash
# In any terminal, press:
Ctrl + C

# This stops that service cleanly
```

### To Restart Everything
```bash
# Terminal 1 (Backend)
cd D:\All Project\library-mangement\backend
npm start

# Terminal 2 (Frontend)  
cd D:\All Project\library-mangement\frontend
npm start

# Arduino: stays running (no action needed)
```

### Check Arduino is Connected
```bash
# In any terminal:
cd D:\All Project\library-mangement\backend

# Test connection (shows serial output):
npm start
# Should show: ✓ Serial port connected on COM18

# Then Ctrl+C to stop
```

---

## 📝 Troubleshooting Flowchart

```
Problem: Nothing working?
    │
    ├─ Can you see http://localhost:3000?
    │   ├─ NO  → Is backend running?
    │   │       ├─ NO  → Run: npm start (in backend)
    │   │       └─ YES → Is frontend running?
    │   │           ├─ NO  → Run: npm start (in frontend)
    │   │           └─ YES → Check browser console (F12)
    │   │
    │   └─ YES → Can you login?
    │       ├─ NO  → Check MongoDB connection in .env
    │       └─ YES → Does dashboard show?
    │           ├─ NO  → Backend not connected to frontend
    │           └─ YES → TAP CARD
    │               ├─ Nothing happens → Check Arduino
    │               ├─ Dashboard updates → SUCCESS! ✓
    │               └─ Wrong student → Check RFID UID in Arduino code
```

---

## 🎬 TL;DR (Too Long; Didn't Read)

1. **Connect everything** (USB cable + wires)
2. **Upload code** to Arduino (Arduino IDE → Upload)
3. **Start backend** (Terminal 1: `npm start` in backend folder)
4. **Start frontend** (Terminal 2: `npm start` in frontend folder)
5. **Open browser** at `http://localhost:3000`
6. **Login** with credentials
7. **Tap RFID card** → See it work! ✓

---

**All set? Start with STEP 1: Connect Hardware** 🚀

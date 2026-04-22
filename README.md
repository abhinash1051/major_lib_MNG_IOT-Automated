# Library Management Dashboard

A professional full-stack Library Management Dashboard with real-time RFID integration.

## Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Integration**: Arduino (ESP32) with RFID

## Features

- Dashboard with real-time statistics
- Student management system
- Book inventory management
- Entry/Exit logs with real-time updates
- Excel/CSV import/export
- Authentication with JWT
- Hardware integration with ESP32 RFID

## Project Structure

```
library-management/
├── frontend/           # React + Tailwind CSS application
├── backend/            # Express + MongoDB server
├── esp32/              # Arduino sketch for ESP32 RFID integration
└── README.md           # Project documentation
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/library-management
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the server:
   ```
   npm start
   ```
   The server no longer seeds a default admin user; create users via the register endpoint.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```
   npm start
   ```

### ESP32 Setup

1. Open the Arduino IDE
2. Install the required libraries:
   - ESP32 board support
   - MFRC522 (for RFID)
   - ArduinoJson
   - WiFi
3. Upload the sketch from the `esp32` directory to your ESP32 board
4. Configure the WiFi credentials and server URL in the sketch

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/import` - Import students from CSV/Excel
- `GET /api/students/export` - Export students to CSV/Excel

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `POST /api/books/import` - Import books from CSV/Excel
- `GET /api/books/export` - Export books to CSV/Excel

### Logs
- `GET /api/logs` - Get all logs
- `GET /api/logs/export` - Export logs to CSV/Excel

### Hardware
- `POST /api/hardware/scan` - Handle RFID scan from ESP32

## Real-time Events (Socket.IO)

- `scan` - Emitted when a new RFID scan is received
- `studentUpdate` - Emitted when student data is updated
- `bookUpdate` - Emitted when book data is updated

## License

MIT
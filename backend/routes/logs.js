const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Helper: load logs from json/logs.json (create file if missing)
const LOGS_PATH = path.join(__dirname, '..', '..', 'json', 'logs.json');

function ensureLogsFile() {
  if (!fs.existsSync(LOGS_PATH)) {
    fs.writeFileSync(LOGS_PATH, JSON.stringify([], null, 2));
  }
}

function loadLogs() {
  ensureLogsFile();
  const raw = fs.readFileSync(LOGS_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  fs.writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));
}

// GET /api/logs - filterable
const getLogs = (req, res) => {
  const { startDate, endDate, eventType, search } = req.query;
  let logs = loadLogs();

  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(l => {
      const n = (l.student?.name || '').toLowerCase();
      const r = (l.student?.rollNo || '').toLowerCase();
      const uid = (l.uid || '').toLowerCase();
      return n.includes(q) || r.includes(q) || uid.includes(q);
    });
  }

  if (eventType && ['entry', 'exit'].includes(eventType)) {
    logs = logs.filter(l => l.eventType === eventType);
  }

  if (startDate) {
    const sd = new Date(startDate);
    logs = logs.filter(l => new Date(l.timestamp) >= sd);
  }
  if (endDate) {
    const ed = new Date(`${endDate}T23:59:59`);
    logs = logs.filter(l => new Date(l.timestamp) <= ed);
  }

  res.status(200).json(logs);
};

// GET /api/logs/export - Excel export
const exportLogs = (req, res) => {
  const logs = loadLogs();
  const rows = logs.map(l => ({
    DateTime: new Date(l.timestamp).toLocaleString(),
    Event: l.eventType,
    Name: l.student?.name || '',
    RollNo: l.student?.rollNo || '',
    UID: l.uid || '',
    Source: l.source || 'rfid'
  }));

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);
  xlsx.utils.book_append_sheet(wb, ws, 'Logs');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="logs.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.status(200).send(buf);
};

// GET /api/logs/daily - per-hour summary
const getDailyStats = (req, res) => {
  const logs = loadLogs();
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, entries: 0, exits: 0 }));
  logs.forEach(l => {
    const d = new Date(l.timestamp);
    const hr = d.getHours();
    if (l.eventType === 'entry') buckets[hr].entries += 1;
    else if (l.eventType === 'exit') buckets[hr].exits += 1;
  });
  res.status(200).json(buckets);
};

// Routes
router.get('/', protect, getLogs);
router.get('/export', protect, exportLogs);
router.get('/daily', protect, getDailyStats);

module.exports = router;
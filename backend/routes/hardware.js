const express = require('express');
const router = express.Router();
const { handleScan } = require('../controllers/hardwareController');

router.post('/scan', handleScan);

module.exports = router;
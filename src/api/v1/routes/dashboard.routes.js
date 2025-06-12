const express = require('express');
const router = express.Router();
const { getDeviceData } = require('../controllers/dashboard.controller');
const { protect } = require('../../../midleware/auth.middleware'); // Reative esta linha

router.get('/device/:deviceId', protect, getDeviceData); // Reative o 'protect' aqui

module.exports = router;
import express from 'express';
import { getDeviceData, sendTestReport, exportReport } from '../controllers/dashboard.controller.js';
import { protect } from '../../../midleware/auth.middleware.js';
import { generateTemperatureReport } from '../../../services/report.service.js';

const router = express.Router();

router.get('/device/:deviceId', protect, getDeviceData);
router.post('/send-test-report', protect, sendTestReport);
router.post('/export-report', protect, exportReport);

export default router;
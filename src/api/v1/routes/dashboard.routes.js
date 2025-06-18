import express from 'express';
import { getDeviceData } from '../controllers/dashboard.controller.js';
import { protect } from '../../../midleware/auth.middleware.js';

const router = express.Router();

router.get('/device/:deviceId', protect, getDeviceData);

export default router;
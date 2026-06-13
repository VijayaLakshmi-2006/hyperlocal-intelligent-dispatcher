import express from 'express';
import { getCustomerAnalytics, getAdminAnalytics } from '../controllers/analyticsController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/customer', protect, getCustomerAnalytics);
router.get('/admin', protect, authorizeRoles('admin'), getAdminAnalytics);

export default router;

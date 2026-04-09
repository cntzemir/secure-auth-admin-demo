const express = require('express');
const router = express.Router();
const requireRole = require('../middleware/requireRole');
const adminController = require('../controllers/adminController');

router.get('/admin', requireRole('admin'), adminController.renderAdminDashboard);
router.get('/admin/users', requireRole('admin'), adminController.renderUsers);
router.get('/admin/logs', requireRole('admin'), adminController.renderLogs);
router.get('/admin/locked-accounts', requireRole('admin'), adminController.renderLockedAccounts);
router.post('/admin/users/:id/unlock', requireRole('admin'), adminController.unlockUser);

module.exports = router;

const express = require('express');
const router = express.Router();
const authRequired = require('../middleware/authRequired');
const userController = require('../controllers/userController');

router.get('/dashboard', authRequired, userController.renderDashboard);
router.get('/profile', authRequired, userController.renderProfile);
router.get('/activity', authRequired, userController.renderActivity);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const guestOnly = require('../middleware/guestOnly');
const validateRequest = require('../middleware/validateRequest');
const { validateRegister, validateLogin, validateForgotPassword } = require('../validators/authValidators');
const { authRateLimiter } = require('../middleware/rateLimit');

router.get('/login', guestOnly, authController.renderLogin);
router.post('/login', authRateLimiter, guestOnly, validateRequest(validateLogin, '/login'), authController.login);
router.get('/register', guestOnly, authController.renderRegister);
router.post('/register', authRateLimiter, guestOnly, validateRequest(validateRegister, '/register'), authController.register);
router.get('/forgot-password', guestOnly, authController.renderForgotPassword);
router.post('/forgot-password', authRateLimiter, guestOnly, validateRequest(validateForgotPassword, '/forgot-password'), authController.forgotPassword);
router.post('/logout', authController.logout);

module.exports = router;

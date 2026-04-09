const authService = require('../services/authService');
const auditService = require('../services/auditService');
const { getClientIp, getUserAgent } = require('../utils/request');

function renderLogin(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.render('auth/login', { title: 'Login' });
}

function renderRegister(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.render('auth/register', { title: 'Register' });
}

function renderForgotPassword(req, res) {
  return res.render('auth/forgot-password', { title: 'Forgot Password' });
}

function register(req, res) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  try {
    const user = authService.registerUser(req.validatedBody || req.body);
    auditService.log({
      userId: user.id,
      emailSnapshot: user.email,
      eventType: 'register',
      eventStatus: 'success',
      ipAddress: ip,
      userAgent,
      route: req.originalUrl,
      note: 'New account created.'
    });
    req.session.flash = { type: 'success', message: 'Account created. You can now log in.' };
    return res.redirect('/login');
  } catch (error) {
    req.session.flash = { type: 'error', message: error.message };
    return res.redirect('/register');
  }
}

function login(req, res) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  try {
    const result = authService.loginUser(req.validatedBody || req.body);
    req.session.user = {
      id: result.user.id,
      fullName: result.user.full_name,
      email: result.user.email,
      role: result.user.role
    };

    auditService.log({
      userId: result.user.id,
      emailSnapshot: result.user.email,
      eventType: 'login',
      eventStatus: 'success',
      ipAddress: ip,
      userAgent,
      route: req.originalUrl,
      note: 'User logged in successfully.'
    });

    req.session.flash = { type: 'success', message: 'Welcome back.' };
    return res.redirect('/dashboard');
  } catch (error) {
    const userFacingMessage = error.message === 'Invalid credentials.'
      ? 'Invalid credentials.'
      : error.message;

    const attemptedEmail = req.validatedBody?.email || req.body.email || null;

    auditService.log({
      userId: error.userId || null,
      emailSnapshot: attemptedEmail,
      eventType: 'login',
      eventStatus: 'failure',
      ipAddress: ip,
      userAgent,
      route: req.originalUrl,
      note: error.message
    });

    if (error.code === 'ACCOUNT_LOCKED_TRIGGERED' && error.user) {
      auditService.log({
        userId: error.user.id,
        emailSnapshot: error.user.email,
        eventType: 'account_locked',
        eventStatus: 'success',
        ipAddress: ip,
        userAgent,
        route: req.originalUrl,
        note: `Temporary lock applied after ${error.user.failed_login_count} failed login attempts.`
      });
    }

    req.session.flash = { type: 'error', message: userFacingMessage };
    return res.redirect('/login');
  }
}

function logout(req, res) {
  const user = req.session.user;
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  req.session.destroy(() => {
    if (user) {
      auditService.log({
        userId: user.id,
        emailSnapshot: user.email,
        eventType: 'logout',
        eventStatus: 'success',
        ipAddress: ip,
        userAgent,
        route: req.originalUrl,
        note: 'User logged out.'
      });
    }
    res.redirect('/login');
  });
}

function forgotPassword(req, res) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const submittedEmail = req.validatedBody?.email || req.body.email || '';

  authService.createResetRequest(submittedEmail);
  auditService.log({
    userId: null,
    emailSnapshot: submittedEmail || null,
    eventType: 'forgot_password_request',
    eventStatus: 'recorded',
    ipAddress: ip,
    userAgent,
    route: req.originalUrl,
    note: 'Password reset request recorded with a generic response.'
  });
  req.session.flash = {
    type: 'success',
    message: 'If an account exists for this email, a reset request has been recorded.'
  };
  return res.redirect('/forgot-password');
}

module.exports = {
  renderLogin,
  renderRegister,
  renderForgotPassword,
  register,
  login,
  logout,
  forgotPassword
};

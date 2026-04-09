const crypto = require('crypto');
const auditService = require('../services/auditService');
const { getClientIp, getUserAgent } = require('../utils/request');

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function ensureCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length || left.length === 0) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function validateCsrf(req, res, next) {
  const method = String(req.method || 'GET').toUpperCase();
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  if (safeMethods.has(method)) {
    return next();
  }

  const submittedToken = req.body ? req.body._csrf : null;
  const sessionToken = req.session ? req.session.csrfToken : null;

  if (safeCompare(submittedToken, sessionToken)) {
    return next();
  }

  auditService.log({
    userId: req.session?.user?.id || null,
    emailSnapshot: req.session?.user?.email || req.body?.email || null,
    eventType: 'csrf_validation',
    eventStatus: 'denied',
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    route: req.originalUrl,
    note: 'Request blocked because the CSRF token was missing or invalid.'
  });

  return res.status(403).render('partials/simple-message', {
    title: 'Forbidden',
    heading: '403',
    message: 'This request could not be completed because the security token was missing or invalid.'
  });
}

module.exports = {
  ensureCsrfToken,
  validateCsrf
};

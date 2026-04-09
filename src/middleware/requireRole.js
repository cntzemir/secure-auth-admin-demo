const auditService = require('../services/auditService');
const { getClientIp, getUserAgent } = require('../utils/request');

module.exports = (role) => (req, res, next) => {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please log in first.' };
    return res.redirect('/login');
  }

  if (req.session.user.role !== role) {
    auditService.log({
      userId: req.session.user.id,
      emailSnapshot: req.session.user.email,
      eventType: 'admin_access_attempt',
      eventStatus: 'denied',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      route: req.originalUrl,
      note: `Denied ${role}-only route access.`
    });
    req.session.flash = { type: 'error', message: 'You do not have permission to access that page.' };
    return res.redirect('/dashboard');
  }

  return next();
};

module.exports = (req, res, next) => {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please log in first.' };
    return res.redirect('/login');
  }
  return next();
};

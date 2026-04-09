function validateRequest(validator, failureRedirect) {
  return (req, res, next) => {
    try {
      req.validatedBody = validator(req.body || {});
      return next();
    } catch (error) {
      req.session.flash = {
        type: 'error',
        message: error.message
      };
      return res.redirect(failureRedirect);
    }
  };
}

module.exports = validateRequest;

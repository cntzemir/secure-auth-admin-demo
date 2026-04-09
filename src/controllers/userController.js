const userService = require('../services/userService');

function renderDashboard(req, res) {
  const dashboardData = userService.getUserDashboardData(req.session.user.id);
  return res.render('user/dashboard', {
    title: 'Dashboard',
    dashboardData
  });
}

function renderProfile(req, res) {
  const profile = userService.getUserProfile(req.session.user.id);
  return res.render('user/profile', {
    title: 'Profile',
    profile
  });
}

function renderActivity(req, res) {
  const activity = userService.getUserActivity(req.session.user.id);
  return res.render('user/activity', {
    title: 'Recent Activity',
    activity
  });
}

module.exports = {
  renderDashboard,
  renderProfile,
  renderActivity
};

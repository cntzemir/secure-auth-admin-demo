const userService = require('../services/userService');
const auditService = require('../services/auditService');
const { getClientIp, getUserAgent } = require('../utils/request');

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function isoOrDash(value) {
  return value || '-';
}

function getRiskLevel(failedLogins) {
  const count = Number(failedLogins || 0);
  if (count >= 5) return 'high';
  if (count >= 3) return 'medium';
  if (count >= 1) return 'low';
  return 'minimal';
}

function getLockState(lockUntil) {
  if (!lockUntil) return 'not_set';
  const expiresAt = new Date(lockUntil).getTime();
  if (Number.isNaN(expiresAt)) return 'unknown';
  return expiresAt > Date.now() ? 'active' : 'expired';
}

function getRemainingMinutes(lockUntil) {
  if (!lockUntil) return '-';
  const expiresAt = new Date(lockUntil).getTime();
  if (Number.isNaN(expiresAt)) return '-';
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return 'expired';
  const minutes = Math.ceil(diffMs / (1000 * 60));
  return `${minutes} min`;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getSeverity(item) {
  const eventType = normalizeText(item.event_type).toLowerCase();
  const status = normalizeText(item.event_status).toLowerCase();
  const note = normalizeText(item.note).toLowerCase();

  if (status === 'denied') return 'high';
  if (status === 'failure' && eventType === 'login') {
    return note.includes('locked') ? 'high' : 'medium';
  }
  if (eventType.includes('unlock')) return 'low';
  if (eventType.includes('logout')) return 'info';
  if (status === 'success') return 'low';
  return 'info';
}

function decorateLog(item) {
  const severity = getSeverity(item);
  const reason = normalizeText(item.note) || '-';
  return {
    ...item,
    severity,
    reason
  };
}

function buildLogFilters(query = {}) {
  return {
    eventType: normalizeText(query.eventType),
    status: normalizeText(query.status),
    severity: normalizeText(query.severity),
    search: normalizeText(query.search)
  };
}

function applyLogFilters(logs, filters) {
  return logs.filter((item) => {
    if (filters.eventType && item.event_type !== filters.eventType) return false;
    if (filters.status && item.event_status !== filters.status) return false;
    if (filters.severity && item.severity !== filters.severity) return false;

    if (filters.search) {
      const haystack = [
        item.event_type,
        item.event_status,
        item.email_snapshot,
        item.ip_address,
        item.route,
        item.note,
        item.reason,
        item.severity
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(filters.search.toLowerCase())) return false;
    }

    return true;
  });
}

function buildFilterOptions(logs) {
  const eventTypes = [...new Set(logs.map((item) => item.event_type).filter(Boolean))].sort();
  const statuses = [...new Set(logs.map((item) => item.event_status).filter(Boolean))].sort();
  const severities = ['high', 'medium', 'low', 'info'];

  return { eventTypes, statuses, severities };
}

function getUserLogCounts(user, logs) {
  const matching = logs.filter((item) => Number(item.user_id) === Number(user.id) || item.email_snapshot === user.email);
  const suspiciousCount = matching.filter((item) => item.severity === 'high' || item.severity === 'medium').length;
  const deniedCount = matching.filter((item) => item.event_status === 'denied').length;
  return { suspiciousCount, deniedCount };
}

function renderAdminDashboard(req, res) {
  const rawStats = userService.getAdminStats() || {};
  const stats = {
    totalUsers: Number(rawStats.totalUsers || 0),
    totalAdmins: Number(rawStats.totalAdmins || 0),
    lockedAccounts: Number(rawStats.lockedAccounts || 0),
    failedLogins24h: Number(rawStats.failedLogins24h || 0),
    suspiciousEvents24h: Number(rawStats.suspiciousEvents24h || 0),
    recentEvents: toArray(rawStats.recentEvents)
  };

  return res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    stats
  });
}

function renderUsers(req, res) {
  const rawUsers = toArray(userService.getAllUsers());
  const decoratedLogs = toArray(auditService.getRecentLogs(250)).map(decorateLog);
  const users = rawUsers.map((user) => {
    const riskLevel = getRiskLevel(user.failed_login_count);
    const lockState = getLockState(user.lock_until);
    const { suspiciousCount, deniedCount } = getUserLogCounts(user, decoratedLogs);
    return {
      ...user,
      riskLevel,
      lockState,
      lockUntilLabel: isoOrDash(user.lock_until),
      remainingLabel: getRemainingMinutes(user.lock_until),
      suspiciousCount,
      deniedCount,
      needsReview: riskLevel === 'high' || suspiciousCount > 0 || deniedCount > 0 || Number(user.is_locked) === 1
    };
  });

  const summary = {
    totalUsers: users.length,
    admins: users.filter((user) => user.role === 'admin').length,
    locked: users.filter((user) => Number(user.is_locked) === 1).length,
    reviewNeeded: users.filter((user) => user.needsReview).length
  };

  return res.render('admin/users', {
    title: 'Users',
    users,
    summary
  });
}

function renderLogs(req, res) {
  const filters = buildLogFilters(req.query || {});
  const allLogs = toArray(auditService.getRecentLogs(250)).map(decorateLog);
  const filterOptions = buildFilterOptions(allLogs);
  const logs = applyLogFilters(allLogs, filters);

  return res.render('admin/logs', {
    title: 'Audit Logs',
    logs,
    filters,
    filterOptions
  });
}

function renderLockedAccounts(req, res) {
  const rawUsers = toArray(userService.getLockedUsers());
  const users = rawUsers.map((user) => ({
    ...user,
    riskLevel: getRiskLevel(user.failed_login_count),
    lockState: getLockState(user.lock_until),
    lockUntilLabel: isoOrDash(user.lock_until),
    remainingLabel: getRemainingMinutes(user.lock_until)
  }));

  const summary = {
    totalLocked: users.length,
    activeLocks: users.filter((user) => user.lockState === 'active').length,
    expiredLocks: users.filter((user) => user.lockState === 'expired').length,
    highestFailedCount: users.reduce((max, user) => Math.max(max, Number(user.failed_login_count || 0)), 0)
  };

  return res.render('admin/locked-accounts', {
    title: 'Locked Accounts',
    users,
    summary
  });
}

function unlockUser(req, res) {
  const adminUser = req.session.user;
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const targetId = Number(req.params.id);
  const target = userService.unlockUser(targetId);

  auditService.log({
    userId: adminUser.id,
    emailSnapshot: adminUser.email,
    eventType: 'admin_unlock_user',
    eventStatus: target ? 'success' : 'failure',
    ipAddress: ip,
    userAgent,
    route: req.originalUrl,
    note: target
      ? `Unlocked user ${target.email}.`
      : `Unlock requested for missing user id ${targetId}.`
  });

  req.session.flash = {
    type: target ? 'success' : 'error',
    message: target ? 'User account unlocked.' : 'Target user was not found.'
  };
  return res.redirect('/admin/locked-accounts');
}

module.exports = {
  renderAdminDashboard,
  renderUsers,
  renderLogs,
  renderLockedAccounts,
  unlockUser
};

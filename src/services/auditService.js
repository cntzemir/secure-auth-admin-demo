const { readStore, writeStore, nextId } = require('../config/store');
const { nowIso } = require('../utils/time');

function log({
  userId = null,
  emailSnapshot = null,
  eventType,
  eventStatus,
  ipAddress = null,
  userAgent = null,
  route = null,
  note = null
}) {
  const store = readStore();
  store.audit_logs.push({
    id: nextId(store, 'audit_logs'),
    user_id: userId,
    email_snapshot: emailSnapshot,
    event_type: eventType,
    event_status: eventStatus,
    ip_address: ipAddress,
    user_agent: userAgent,
    route,
    note,
    created_at: nowIso()
  });
  writeStore(store);
}

function sortNewest(items) {
  return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function inWindow(createdAt, minutes) {
  return new Date(createdAt).getTime() >= Date.now() - minutes * 60 * 1000;
}

function getBurstCount(logs, currentLog, { eventType, eventStatus, minutes = 15, groupBy = 'email_snapshot' }) {
  const key = currentLog[groupBy] || null;
  if (!key) {
    return 0;
  }

  return logs.filter((item) => {
    return item[groupBy] === key
      && item.event_type === eventType
      && item.event_status === eventStatus
      && inWindow(item.created_at, minutes);
  }).length;
}

function getIpBurstCount(logs, currentLog, { eventType, eventStatus, minutes = 15 }) {
  const ip = currentLog.ip_address || null;
  if (!ip) {
    return 0;
  }

  return logs.filter((item) => {
    return item.ip_address === ip
      && item.event_type === eventType
      && item.event_status === eventStatus
      && inWindow(item.created_at, minutes);
  }).length;
}

function enrichLog(log, allLogs) {
  let severity = 'info';
  let reason = 'Routine security event';

  const emailBurst = getBurstCount(allLogs, log, {
    eventType: 'login',
    eventStatus: 'failure',
    minutes: 15,
    groupBy: 'email_snapshot'
  });

  const ipBurst = getIpBurstCount(allLogs, log, {
    eventType: 'login',
    eventStatus: 'failure',
    minutes: 15
  });

  const resetBurst = getBurstCount(allLogs, log, {
    eventType: 'forgot_password_request',
    eventStatus: 'recorded',
    minutes: 30,
    groupBy: 'email_snapshot'
  });

  if (log.event_status === 'denied') {
    severity = 'high';
    reason = 'Unauthorized or denied access attempt';
  } else if (log.event_type === 'account_locked') {
    severity = 'high';
    reason = 'Account lock triggered after repeated failed logins';
  } else if (log.event_type === 'login' && log.event_status === 'failure' && /temporarily locked/i.test(log.note || '')) {
    severity = 'high';
    reason = 'Account lock triggered after repeated failed logins';
  } else if (log.event_type === 'login' && log.event_status === 'failure' && (emailBurst >= 3 || ipBurst >= 5)) {
    severity = 'medium';
    reason = 'Repeated failed login pattern in a short time window';
  } else if (log.event_type === 'forgot_password_request' && resetBurst >= 3) {
    severity = 'medium';
    reason = 'Repeated password reset requests detected';
  } else if (log.event_type === 'csrf_validation' || log.event_type === 'csrf_invalid') {
    severity = 'high';
    reason = 'Invalid or missing CSRF token';
  } else if (log.event_type === 'admin_unlock_user') {
    severity = 'medium';
    reason = 'Privileged account state change';
  } else if (log.event_type === 'register') {
    severity = 'low';
    reason = 'New account registration';
  } else if (log.event_type === 'login' && log.event_status === 'success') {
    severity = 'low';
    reason = 'Successful login';
  } else if (log.event_type === 'logout') {
    severity = 'low';
    reason = 'Successful logout';
  }

  return {
    ...log,
    severity,
    reason,
    is_suspicious: severity === 'high' || severity === 'medium'
  };
}

function getEnrichedLogs() {
  const store = readStore();
  const sorted = sortNewest(store.audit_logs);
  return sorted.map((item) => enrichLog(item, sorted));
}

function getRecentLogs(limit = 50, filters = {}) {
  const {
    eventType = '',
    status = '',
    severity = '',
    search = ''
  } = filters;

  const normalizedSearch = String(search || '').trim().toLowerCase();

  return getEnrichedLogs()
    .filter((item) => !eventType || item.event_type === eventType)
    .filter((item) => !status || item.event_status === status)
    .filter((item) => !severity || item.severity === severity)
    .filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        item.email_snapshot,
        item.ip_address,
        item.route,
        item.note,
        item.reason,
        item.event_type,
        item.event_status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    })
    .slice(0, limit);
}

function getFilterOptions() {
  const logs = getEnrichedLogs();
  const eventTypes = [...new Set(logs.map((item) => item.event_type))].sort();
  const statuses = [...new Set(logs.map((item) => item.event_status))].sort();
  const severities = ['high', 'medium', 'low', 'info'];
  return { eventTypes, statuses, severities };
}

function getSecuritySummary(hours = 24) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const recentLogs = getEnrichedLogs().filter((item) => new Date(item.created_at).getTime() >= cutoff);

  return {
    suspiciousEvents24h: recentLogs.filter((item) => item.is_suspicious).length,
    deniedAccess24h: recentLogs.filter((item) => item.event_status === 'denied').length,
    repeatedFailures24h: recentLogs.filter((item) => item.reason === 'Repeated failed login pattern in a short time window').length,
    highPriorityEvents: recentLogs.filter((item) => item.severity === 'high').slice(0, 6),
    suspiciousEvents: recentLogs.filter((item) => item.is_suspicious).slice(0, 8)
  };
}

module.exports = {
  log,
  getRecentLogs,
  getFilterOptions,
  getSecuritySummary
};

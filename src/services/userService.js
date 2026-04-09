const { readStore, writeStore } = require('../config/store');
const { nowIso, minutesFromNowIso } = require('../utils/time');

function findByEmail(email) {
  return readStore().users.find((user) => user.email === email) || null;
}

function findById(id) {
  return readStore().users.find((user) => Number(user.id) === Number(id)) || null;
}

function getUserProfile(id) {
  return findById(id);
}

function getUserActivity(id) {
  return readStore().audit_logs
    .filter((item) => Number(item.user_id) === Number(id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 25);
}

function getUserDashboardData(id) {
  const profile = findById(id);
  const recentActivity = getUserActivity(id).slice(0, 5);
  return { profile, recentActivity };
}

function getAllUsers() {
  return [...readStore().users].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function getLockedUsers() {
  return getAllUsers().filter((user) => Number(user.is_locked) === 1);
}

function updateUser(id, updater) {
  const store = readStore();
  const index = store.users.findIndex((user) => Number(user.id) === Number(id));
  if (index === -1) {
    return null;
  }
  store.users[index] = updater({ ...store.users[index] });
  writeStore(store);
  return store.users[index];
}

function recordFailedLogin(id) {
  return updateUser(id, (user) => {
    const nextCount = Number(user.failed_login_count || 0) + 1;
    const shouldLock = nextCount >= 5;
    user.failed_login_count = nextCount;
    user.is_locked = shouldLock ? 1 : 0;
    user.lock_until = shouldLock ? minutesFromNowIso(15) : null;
    user.updated_at = nowIso();
    return user;
  });
}

function resetFailedLoginState(id) {
  return updateUser(id, (user) => {
    user.failed_login_count = 0;
    user.is_locked = 0;
    user.lock_until = null;
    user.updated_at = nowIso();
    return user;
  });
}

function clearLock(id) {
  return resetFailedLoginState(id);
}

function updateLastLogin(id) {
  return updateUser(id, (user) => {
    user.last_login_at = nowIso();
    user.updated_at = nowIso();
    return user;
  });
}

function getAdminStats() {
  const store = readStore();
  const totalUsers = store.users.length;
  const totalAdmins = store.users.filter((user) => user.role === 'admin').length;
  const lockedAccounts = store.users.filter((user) => Number(user.is_locked) === 1).length;
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const failedLogins24h = store.audit_logs.filter(
    (item) => item.event_type === 'login' && item.event_status === 'failure' && new Date(item.created_at).getTime() >= twentyFourHoursAgo
  ).length;
  const suspiciousEvents24h = store.audit_logs.filter(
    (item) => item.event_status === 'denied' && new Date(item.created_at).getTime() >= twentyFourHoursAgo
  ).length;
  const recentEvents = [...store.audit_logs]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  return {
    totalUsers,
    totalAdmins,
    lockedAccounts,
    failedLogins24h,
    suspiciousEvents24h,
    recentEvents
  };
}

function unlockUser(id) {
  return resetFailedLoginState(id);
}

function createUser({ full_name, email, password_hash, role = 'user' }) {
  const store = readStore();
  const now = nowIso();
  const user = {
    id: (store.counters.users || 0) + 1,
    full_name,
    email,
    password_hash,
    role,
    failed_login_count: 0,
    lock_until: null,
    is_locked: 0,
    last_login_at: null,
    created_at: now,
    updated_at: now
  };
  store.counters.users = user.id;
  store.users.push(user);
  writeStore(store);
  return user;
}

module.exports = {
  findByEmail,
  findById,
  getUserProfile,
  getUserActivity,
  getUserDashboardData,
  getAllUsers,
  getLockedUsers,
  recordFailedLogin,
  resetFailedLoginState,
  clearLock,
  updateLastLogin,
  getAdminStats,
  unlockUser,
  createUser
};

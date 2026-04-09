const crypto = require('crypto');
const { hashPassword, comparePassword } = require('../utils/password');
const userService = require('./userService');
const { readStore, writeStore, nextId } = require('../config/store');
const { nowIso, minutesFromNowIso } = require('../utils/time');

function validateRegisterInput(input) {
  const fullName = String(input.fullName || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const confirmPassword = String(input.confirmPassword || '');

  if (!fullName || fullName.length < 2) {
    throw new Error('Please enter a valid full name.');
  }
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('Password must include uppercase, lowercase, and a number.');
  }
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  return { fullName, email, password };
}

function registerUser(input) {
  const { fullName, email, password } = validateRegisterInput(input);
  const existing = userService.findByEmail(email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }
  const hashedPassword = hashPassword(password);
  return userService.createUser({
    full_name: fullName,
    email,
    password_hash: hashedPassword,
    role: 'user'
  });
}

function validateLoginInput(input) {
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');

  if (!email || !password) {
    throw new Error('Invalid credentials.');
  }

  return { email, password };
}

function loginUser(input) {
  const { email, password } = validateLoginInput(input);
  const user = userService.findByEmail(email);

  if (!user) {
    throw new Error('Invalid credentials.');
  }

  if (user.is_locked && user.lock_until) {
    const unlockDate = new Date(user.lock_until);
    if (unlockDate > new Date()) {
      const error = new Error('Your account is temporarily locked. Please try again later.');
      error.userId = user.id;
      error.code = 'ACCOUNT_CURRENTLY_LOCKED';
      throw error;
    }
    userService.clearLock(user.id);
  }

  const passwordMatches = comparePassword(password, user.password_hash);
  if (!passwordMatches) {
    const updatedUser = userService.recordFailedLogin(user.id);
    const error = new Error(
      updatedUser.is_locked
        ? 'Your account is temporarily locked. Please try again later.'
        : 'Invalid credentials.'
    );
    error.userId = user.id;
    error.code = updatedUser.is_locked ? 'ACCOUNT_LOCKED_TRIGGERED' : 'INVALID_CREDENTIALS';
    error.user = updatedUser;
    throw error;
  }

  userService.resetFailedLoginState(user.id);
  userService.updateLastLogin(user.id);
  return { user: userService.findById(user.id) };
}

function createResetRequest(emailInput) {
  const email = String(emailInput || '').trim().toLowerCase();
  const user = userService.findByEmail(email);
  const token = crypto.randomBytes(8).toString('hex');
  const store = readStore();
  store.password_reset_requests.push({
    id: nextId(store, 'password_reset_requests'),
    user_id: user ? user.id : null,
    email_snapshot: email || 'unknown',
    token_mock: token,
    expires_at: minutesFromNowIso(30),
    used: 0,
    created_at: nowIso()
  });
  writeStore(store);
}

module.exports = {
  registerUser,
  loginUser,
  createResetRequest
};

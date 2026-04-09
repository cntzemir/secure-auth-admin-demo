function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegister(body) {
  const fullName = normalizeText(body.fullName);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (fullName.length < 2) {
    throw new Error('Please enter a valid full name.');
  }
  if (!isValidEmail(email)) {
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

  return {
    fullName,
    email,
    password,
    confirmPassword
  };
}

function validateLogin(body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!isValidEmail(email) || !password) {
    throw new Error('Invalid credentials.');
  }

  return {
    email,
    password
  };
}

function validateForgotPassword(body) {
  const email = normalizeEmail(body.email);

  if (!isValidEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }

  return { email };
}

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword
};

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const dataPath = path.join(dataDir, 'app.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(
    dataPath,
    JSON.stringify({ users: [], audit_logs: [], password_reset_requests: [], counters: { users: 0, audit_logs: 0, password_reset_requests: 0 } }, null, 2)
  );
}

const db = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
const existing = db.users.find((user) => user.email === adminEmail);

if (!existing) {
  const now = new Date().toISOString();
  db.counters.users += 1;
  db.users.push({
    id: db.counters.users,
    full_name: 'System Admin',
    email: adminEmail,
    password_hash: bcrypt.hashSync(adminPassword, 10),
    role: 'admin',
    failed_login_count: 0,
    lock_until: null,
    is_locked: 0,
    last_login_at: null,
    created_at: now,
    updated_at: now
  });
  fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
  console.log(`Seeded default admin: ${adminEmail}`);
} else {
  console.log(`Admin already exists: ${adminEmail}`);
}

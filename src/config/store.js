const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const storePath = path.join(dataDir, 'app.json');

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(storePath)) {
    const initialData = {
      users: [],
      audit_logs: [],
      password_reset_requests: [],
      counters: {
        users: 0,
        audit_logs: 0,
        password_reset_requests: 0
      }
    };
    fs.writeFileSync(storePath, JSON.stringify(initialData, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

function nextId(store, key) {
  store.counters[key] = (store.counters[key] || 0) + 1;
  return store.counters[key];
}

module.exports = {
  ensureStore,
  readStore,
  writeStore,
  nextId,
  storePath
};

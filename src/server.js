require('dotenv').config();
const app = require('./app');
const { ensureStore } = require('./config/store');

ensureStore();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

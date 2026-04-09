const path = require('path');
const express = require('express');
const helmet = require('helmet');
const sessionMiddleware = require('./config/session');
const attachLocals = require('./middleware/attachLocals');
const { ensureCsrfToken, validateCsrf } = require('./middleware/csrfProtection');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(sessionMiddleware);
app.use(attachLocals);
app.use(ensureCsrfToken);
app.use(validateCsrf);

app.get('/', (req, res) => {
  res.render('home', { title: 'Secure Auth & Admin Panel Demo' });
});

app.use(authRoutes);
app.use(userRoutes);
app.use(adminRoutes);

app.use((req, res) => {
  res.status(404).render('partials/simple-message', {
    title: 'Not Found',
    heading: '404',
    message: 'The page you are looking for does not exist.'
  });
});

module.exports = app;

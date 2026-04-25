// routes/auth.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const store = require('../data/store');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/auth/login
router.post(
  '/login',
  body('email').isEmail().withMessage('Valid email required.'),
  body('password').isString().isLength({ min: 1 }).withMessage('Password required.'),
  validate,
  (req, res) => {
    const { email, password } = req.body;

    const user = store.users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const ok = bcrypt.compareSync(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = uuidv4();
    const now = Date.now();
    const expiresAt = now + store.SESSION_TTL_MS;
    store.sessions[token] = { userId: user.id, tenant: user.tenant, createdAt: now, expiresAt };

    const { passwordHash: _ph, ...safeUser } = user;
    res.json({ token, expiresAt, user: safeUser });
  }
);

// POST /api/auth/logout
router.post('/logout', auth, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  delete store.sessions[token];
  res.json({ message: 'Logged out.' });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const { passwordHash: _ph, ...safeUser } = req.user;
  res.json(safeUser);
});

module.exports = router;

// middleware/auth.js
const store = require('../data/store');

function auth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const session = token ? store.sessions[token] : null;
  if (!token || !session) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  if (session.expiresAt && Date.now() > session.expiresAt) {
    delete store.sessions[token];
    return res.status(401).json({ error: 'Session expired. Please login again.' });
  }

  const user = store.users.find(u => u.id === session.userId);
  if (!user) {
    delete store.sessions[token];
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  req.user = { ...user };
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

function managerOrAbove(req, res, next) {
  if (!['Admin', 'Manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Manager or Admin access required.' });
  }
  next();
}

module.exports = { auth, adminOnly, managerOrAbove };

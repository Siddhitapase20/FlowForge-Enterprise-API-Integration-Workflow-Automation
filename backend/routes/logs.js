// routes/logs.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { auth } = require('../middleware/auth');

// GET /api/logs?status=success|error&wf=wf1&limit=50
router.get('/', auth, (req, res) => {
  const { status, wf, limit = 100 } = req.query;
  // Get workflow IDs for this tenant
  const tenantWfIds = store.workflows.filter(w => w.tenant === req.user.tenant).map(w => w.id);
  let logs = store.logs.filter(l => tenantWfIds.includes(l.wf));
  if (status) logs = logs.filter(l => l.status === status);
  if (wf)     logs = logs.filter(l => l.wf === wf);
  res.json(logs.slice(0, parseInt(limit)));
});

// DELETE /api/logs - clear all logs (admin)
router.delete('/', auth, (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only.' });
  store.logs = [];
  res.json({ message: 'Logs cleared.' });
});

module.exports = router;

// routes/analytics.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { auth, adminOnly } = require('../middleware/auth');

function ensureTenantIntegrations(tenant) {
  if (!store.tenantIntegrations[tenant]) {
    store.tenantIntegrations[tenant] = Object.fromEntries(
      store.integrations.map(i => [i.id, { connected: !!i.connected, calls: Number(i.calls || 0) }])
    );
  }
  return store.tenantIntegrations[tenant];
}

// GET /api/analytics/summary
router.get('/summary', auth, (req, res) => {
  const wfs = store.workflows.filter(w => w.tenant === req.user.tenant);
  const tenantWfIds = wfs.map(w => w.id);
  const logs = store.logs.filter(l => tenantWfIds.includes(l.wf));

  const totalRuns = wfs.reduce((s, w) => s + w.runs, 0);
  const successCount = logs.filter(l => l.status === 'success').length;
  const successRate = logs.length ? Math.round((successCount / logs.length) * 100) : 0;
  const activeWorkflows = wfs.filter(w => w.status === 'active').length;
  const tenantIntegrations = ensureTenantIntegrations(req.user.tenant);
  const connectedIntegrations = Object.values(tenantIntegrations).filter(i => i.connected).length;

  // Weekly bar chart (last 7 days simulated)
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const weeklyData = days.map(d => ({
    day: d,
    runs: Math.floor(Math.random() * 60 + 20),
    success: Math.floor(Math.random() * 15 + 80),
  }));

  res.json({
    totalRuns, successRate, activeWorkflows, connectedIntegrations,
    totalLogs: logs.length,
    totalWorkflows: wfs.length,
    weeklyData,
    topWorkflows: [...wfs].sort((a, b) => b.runs - a.runs).slice(0, 5),
  });
});

// GET /api/tenants (admin only)
router.get('/tenants', auth, adminOnly, (req, res) => {
  res.json(store.tenants);
});

module.exports = router;

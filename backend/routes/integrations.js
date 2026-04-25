// routes/integrations.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { auth, managerOrAbove } = require('../middleware/auth');

function ensureTenantIntegrations(tenant) {
  if (!store.tenantIntegrations[tenant]) {
    store.tenantIntegrations[tenant] = Object.fromEntries(
      store.integrations.map(i => [i.id, { connected: !!i.connected, calls: Number(i.calls || 0) }])
    );
  }
  return store.tenantIntegrations[tenant];
}

router.get('/', auth, (req, res) => {
  const state = ensureTenantIntegrations(req.user.tenant);
  const view = store.integrations.map(i => ({
    ...i,
    connected: !!state[i.id]?.connected,
    calls: Number(state[i.id]?.calls || 0),
  }));
  res.json(view);
});

router.patch('/:id/toggle', auth, managerOrAbove, (req, res) => {
  const integration = store.integrations.find(i => i.id === req.params.id);
  if (!integration) return res.status(404).json({ error: 'Integration not found.' });

  const state = ensureTenantIntegrations(req.user.tenant);
  const current = state[integration.id] || { connected: false, calls: 0 };
  const next = { ...current, connected: !current.connected };
  if (next.connected) next.calls = 0;
  state[integration.id] = next;

  res.json({ ...integration, ...next });
});

module.exports = router;

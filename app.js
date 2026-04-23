const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// ─── IN-MEMORY DATABASE ───────────────────────────────────────────────────────
const db = {
  users: [
    { id: 'u1', name: 'Alex Morgan',  email: 'alex@acme.com',   password: 'admin123', role: 'Admin',   company: 'c1', avatar: 'AM', active: true },
    { id: 'u2', name: 'Sam Rivera',   email: 'sam@acme.com',    password: 'admin123', role: 'Manager', company: 'c1', avatar: 'SR', active: true },
    { id: 'u3', name: 'Jamie Lee',    email: 'jamie@acme.com',  password: 'admin123', role: 'User',    company: 'c1', avatar: 'JL', active: true },
    { id: 'u4', name: 'Taylor Kim',   email: 'taylor@neon.io',  password: 'admin123', role: 'Admin',   company: 'c2', avatar: 'TK', active: true },
  ],
  companies: [
    { id: 'c1', name: 'Acme Corp',  plan: 'Enterprise' },
    { id: 'c2', name: 'Neon Labs',  plan: 'Pro' },
  ],
  workflows: [
    { id: 'w1', name: 'Order → Email Confirmation',  trigger: 'new_order',       action: 'send_email',    enabled: true,  runs: 142, errors: 2,  lastRun: Date.now()-300000,   company: 'c1', createdBy: 'u1', retries: 3 },
    { id: 'w2', name: 'Payment → Slack Notify',      trigger: 'payment_received',action: 'send_slack',    enabled: true,  runs: 89,  errors: 0,  lastRun: Date.now()-900000,   company: 'c1', createdBy: 'u1', retries: 3 },
    { id: 'w3', name: 'New Lead → CRM Update',       trigger: 'new_lead',        action: 'update_crm',    enabled: true,  runs: 67,  errors: 5,  lastRun: Date.now()-3600000,  company: 'c1', createdBy: 'u2', retries: 3 },
    { id: 'w4', name: 'Ticket → Task Creator',       trigger: 'support_ticket',  action: 'create_task',   enabled: false, runs: 23,  errors: 1,  lastRun: Date.now()-86400000, company: 'c1', createdBy: 'u2', retries: 3 },
    { id: 'w5', name: 'Low Stock → Team Alert',      trigger: 'inventory_low',   action: 'notify_team',   enabled: true,  runs: 8,   errors: 0,  lastRun: Date.now()-7200000,  company: 'c1', createdBy: 'u1', retries: 3 },
    { id: 'w6', name: 'Signup → Welcome Email',      trigger: 'user_signup',     action: 'send_email',    enabled: true,  runs: 34,  errors: 0,  lastRun: Date.now()-1800000,  company: 'c2', createdBy: 'u4', retries: 3 },
    { id: 'w7', name: 'Refund → Invoice Generate',   trigger: 'refund_request',  action: 'generate_invoice', enabled: true, runs: 12, errors: 1, lastRun: Date.now()-5400000, company: 'c1', createdBy: 'u1', retries: 2 },
  ],
  integrations: [
    { id: 'i1', name: 'Shopify',    icon: '🛍️', status: 'connected',    category: 'E-Commerce', calls: 142 },
    { id: 'i2', name: 'Stripe',     icon: '💳', status: 'connected',    category: 'Payments',   calls: 89 },
    { id: 'i3', name: 'HubSpot',    icon: '🧲', status: 'connected',    category: 'CRM',        calls: 67 },
    { id: 'i4', name: 'SendGrid',   icon: '✉️', status: 'connected',    category: 'Email',      calls: 234 },
    { id: 'i5', name: 'Slack',      icon: '💬', status: 'connected',    category: 'Messaging',  calls: 55 },
    { id: 'i6', name: 'Asana',      icon: '✅', status: 'disconnected', category: 'Tasks',      calls: 0 },
    { id: 'i7', name: 'Twilio',     icon: '📱', status: 'disconnected', category: 'SMS',        calls: 0 },
    { id: 'i8', name: 'Airtable',   icon: '📋', status: 'connected',    category: 'Data',       calls: 38 },
  ],
  logs: [],
  notifications: [],
};

// ─── WORKFLOW ENGINE ──────────────────────────────────────────────────────────
class WorkflowEngine {
  async execute(workflow, triggerEvent) {
    const logEntry = {
      id: uuidv4(),
      workflowId: workflow.id,
      workflowName: workflow.name,
      trigger: workflow.trigger,
      action: workflow.action,
      status: 'running',
      retries: 0,
      duration: 0,
      ts: Date.now(),
      company: workflow.company,
    };
    db.logs.push(logEntry);

    // Async execution with retry
    this._runWithRetry(workflow, logEntry, workflow.retries || 3);
    return logEntry;
  }

  async _runWithRetry(workflow, log, retriesLeft) {
    const start = Date.now();
    await this._delay(200 + Math.random() * 600);
    try {
      await this._callMockAPI(workflow.action);
      log.status   = 'success';
      log.duration = Date.now() - start;
    } catch (err) {
      if (retriesLeft > 0) {
        log.retries++;
        await this._delay(300);
        return this._runWithRetry(workflow, log, retriesLeft - 1);
      }
      log.status   = 'error';
      log.error    = err.message;
      log.duration = Date.now() - start;
    }
    // Update workflow stats
    const wf = db.workflows.find(w => w.id === workflow.id);
    if (wf) {
      wf.runs++;
      wf.lastRun = Date.now();
      if (log.status === 'error') wf.errors++;
    }
    // Push notification
    db.notifications.push({
      id: uuidv4(),
      workflowName: workflow.name,
      status: log.status,
      message: log.status === 'success' ? `Done in ${log.duration}ms` : `Failed after ${log.retries} retries`,
      ts: Date.now(),
      company: workflow.company,
    });
  }

  async _callMockAPI(actionId) {
    await this._delay(80 + Math.random() * 300);
    if (Math.random() < 0.12) throw new Error('Mock API timeout');
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}
const engine = new WorkflowEngine();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.users.find(u => u.id === token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
}

function rbac(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safeUser } = user;
  res.json({ token: user.id, user: safeUser });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, company } = req.body;
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const newUser = { id: uuidv4(), name, email, password, role: 'User', company: company || 'c1', avatar: name.slice(0,2).toUpperCase(), active: true };
  db.users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  res.json({ token: newUser.id, user: safeUser });
});

// ─── WORKFLOW ROUTES ──────────────────────────────────────────────────────────
app.get('/api/workflows', auth, (req, res) => {
  const wfs = db.workflows.filter(w => w.company === req.user.company);
  res.json(wfs);
});

app.post('/api/workflows', auth, rbac('Admin','Manager'), (req, res) => {
  const wf = { id: uuidv4(), ...req.body, runs: 0, errors: 0, lastRun: Date.now(), company: req.user.company, createdBy: req.user.id };
  db.workflows.push(wf);
  res.json(wf);
});

app.patch('/api/workflows/:id/toggle', auth, rbac('Admin','Manager'), (req, res) => {
  const wf = db.workflows.find(w => w.id === req.params.id && w.company === req.user.company);
  if (!wf) return res.status(404).json({ error: 'Not found' });
  wf.enabled = !wf.enabled;
  res.json(wf);
});

app.delete('/api/workflows/:id', auth, rbac('Admin'), (req, res) => {
  const idx = db.workflows.findIndex(w => w.id === req.params.id && w.company === req.user.company);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.workflows.splice(idx, 1);
  res.json({ success: true });
});

// ─── SIMULATE ROUTE ───────────────────────────────────────────────────────────
app.post('/api/simulate/:event', auth, (req, res) => {
  const triggerId = req.params.event;
  const matching = db.workflows.filter(w => w.trigger === triggerId && w.enabled && w.company === req.user.company);
  if (!matching.length) return res.json({ fired: 0, message: 'No active workflows match this trigger' });
  const runningLogs = matching.map(wf => engine.execute(wf, req.body));
  res.json({ fired: matching.length, logs: runningLogs });
});

// ─── INTEGRATIONS ROUTES ──────────────────────────────────────────────────────
app.get('/api/integrations', auth, (req, res) => res.json(db.integrations));

app.patch('/api/integrations/:id/toggle', auth, rbac('Admin'), (req, res) => {
  const int = db.integrations.find(i => i.id === req.params.id);
  if (!int) return res.status(404).json({ error: 'Not found' });
  int.status = int.status === 'connected' ? 'disconnected' : 'connected';
  int.calls  = int.status === 'connected' ? Math.floor(Math.random()*50) : 0;
  res.json(int);
});

// ─── LOGS ROUTES ─────────────────────────────────────────────────────────────
app.get('/api/logs', auth, (req, res) => {
  const logs = db.logs.filter(l => l.company === req.user.company);
  res.json([...logs].reverse());
});

app.delete('/api/logs', auth, rbac('Admin','Manager'), (req, res) => {
  db.logs = db.logs.filter(l => l.company !== req.user.company);
  res.json({ success: true });
});

// ─── NOTIFICATIONS ROUTES ─────────────────────────────────────────────────────
app.get('/api/notifications', auth, (req, res) => {
  const notes = db.notifications.filter(n => n.company === req.user.company);
  res.json([...notes].reverse().slice(0, 20));
});

// ─── ANALYTICS ROUTE ──────────────────────────────────────────────────────────
app.get('/api/analytics', auth, (req, res) => {
  const wfs  = db.workflows.filter(w => w.company === req.user.company);
  const logs = db.logs.filter(l => l.company === req.user.company);
  const triggerCounts = logs.reduce((acc, l) => { acc[l.trigger] = (acc[l.trigger]||0)+1; return acc; }, {});
  res.json({
    totalWorkflows: wfs.length,
    activeWorkflows: wfs.filter(w=>w.enabled).length,
    totalRuns: wfs.reduce((a,b)=>a+b.runs,0),
    totalErrors: wfs.reduce((a,b)=>a+b.errors,0),
    triggerCounts,
    workflowHealth: wfs.map(w => ({ name: w.name, rate: w.runs ? Math.round(((w.runs-w.errors)/w.runs)*100) : 100 })),
  });
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
app.get('/api/admin/users', auth, rbac('Admin'), (req, res) => {
  res.json(db.users.map(u => { const {password,...s}=u; return s; }));
});

app.patch('/api/admin/users/:id/toggle', auth, rbac('Admin'), (req, res) => {
  const u = db.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  u.active = !u.active;
  const {password,...s}=u;
  res.json(s);
});

app.get('/api/admin/companies', auth, rbac('Admin'), (req, res) => {
  res.json(db.companies.map(c => ({ ...c, workflows: db.workflows.filter(w=>w.company===c.id).length, users: db.users.filter(u=>u.company===c.id).length })));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ FlowForge API running on http://localhost:${PORT}`));

module.exports = app;

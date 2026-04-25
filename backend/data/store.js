// data/store.js - In-memory database
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 8); // 8 hours

const store = {
  users: [
    { id: '1', name: 'Alex Morgan',  email: 'admin@flowforge.io',   passwordHash: bcrypt.hashSync('admin123', 10),   role: 'Admin',   company: 'TechCorp',  tenant: 'techcorp' },
    { id: '2', name: 'Jordan Lee',   email: 'manager@flowforge.io', passwordHash: bcrypt.hashSync('manager123', 10), role: 'Manager', company: 'TechCorp',  tenant: 'techcorp' },
    { id: '3', name: 'Sam Rivers',   email: 'user@flowforge.io',    passwordHash: bcrypt.hashSync('user123', 10),    role: 'User',    company: 'TechCorp',  tenant: 'techcorp' },
    { id: '4', name: 'Dana CEO',     email: 'ceo@globalent.io',     passwordHash: bcrypt.hashSync('ceo123', 10),     role: 'Admin',   company: 'GlobalEnt', tenant: 'globalent' },
  ],

  workflows: [
    { id: 'wf1', name: 'New Order → Email Confirm', tenant: 'techcorp', status: 'active',  trigger: 'new_order',        actions: ['send_email','update_crm'],            condition: 'always',        createdBy: 'Alex Morgan', runs: 142, successRate: 97,  retryEnabled: true,  maxRetries: 3, description: 'Sends confirmation email and updates CRM on new order.' },
    { id: 'wf2', name: 'Payment → Slack Notify',    tenant: 'techcorp', status: 'active',  trigger: 'payment_received', actions: ['send_slack','create_invoice'],         condition: 'amount_gt',     createdBy: 'Jordan Lee',  runs: 88,  successRate: 100, retryEnabled: false, maxRetries: 0, description: 'Notifies team on Slack and generates invoice on payment.' },
    { id: 'wf3', name: 'New Lead → CRM + Task',     tenant: 'techcorp', status: 'paused',  trigger: 'new_lead',         actions: ['update_crm','create_task','send_email'],condition: 'email_domain',  createdBy: 'Alex Morgan', runs: 54,  successRate: 89,  retryEnabled: true,  maxRetries: 2, description: 'Adds lead to CRM, creates follow-up task, sends welcome email.' },
    { id: 'wf4', name: 'Low Stock → Restock Alert', tenant: 'techcorp', status: 'active',  trigger: 'low_stock',        actions: ['send_email','notify_team'],            condition: 'always',        createdBy: 'Sam Rivers',  runs: 12,  successRate: 100, retryEnabled: false, maxRetries: 0, description: 'Alerts team when inventory drops below threshold.' },
    { id: 'wf5', name: 'Signup → Welcome Email',    tenant: 'techcorp', status: 'active',  trigger: 'user_signup',      actions: ['send_email','add_tag'],               condition: 'always',        createdBy: 'Jordan Lee',  runs: 203, successRate: 99,  retryEnabled: true,  maxRetries: 1, description: 'Sends welcome email and tags new user in CRM.' },
  ],

  logs: [
    { id: uuidv4(), wf: 'wf1', wfName: 'New Order → Email Confirm',  trigger: 'new_order',        status: 'success', msg: 'Order #10421 processed. Email sent to john@example.com. CRM updated.', duration: 324, ts: Date.now() - 3600000 },
    { id: uuidv4(), wf: 'wf2', wfName: 'Payment → Slack Notify',     trigger: 'payment_received', status: 'success', msg: 'Payment $249 received. Slack notification sent. Invoice INV-0092 created.', duration: 512, ts: Date.now() - 7200000 },
    { id: uuidv4(), wf: 'wf5', wfName: 'Signup → Welcome Email',     trigger: 'user_signup',      status: 'success', msg: 'User alice@example.com signed up. Welcome email sent. Tagged as "new-user".', duration: 201, ts: Date.now() - 10800000 },
    { id: uuidv4(), wf: 'wf3', wfName: 'New Lead → CRM + Task',      trigger: 'new_lead',         status: 'error',   msg: 'Failed to update CRM: Connection timeout. Retry scheduled.', duration: null, ts: Date.now() - 14400000 },
    { id: uuidv4(), wf: 'wf4', wfName: 'Low Stock → Restock Alert',  trigger: 'low_stock',        status: 'success', msg: 'SKU-884 below threshold (5 units). Alert sent to warehouse@company.com.', duration: 145, ts: Date.now() - 18000000 },
  ],

  integrations: [
    { id: 'shopify',       name: 'Shopify',       icon: '🛍️',  cat: 'E-Commerce',   desc: 'Sync orders, products & customers', connected: true,  calls: 1240 },
    { id: 'stripe',        name: 'Stripe',        icon: '💳',  cat: 'Payments',     desc: 'Process payments & subscriptions',  connected: true,  calls: 876  },
    { id: 'mailchimp',     name: 'Mailchimp',     icon: '📧',  cat: 'Email',        desc: 'Email campaigns & automation',      connected: true,  calls: 430  },
    { id: 'salesforce',    name: 'Salesforce',    icon: '☁️',  cat: 'CRM',          desc: 'CRM & sales pipeline',              connected: false, calls: 0    },
    { id: 'slack',         name: 'Slack',         icon: '💬',  cat: 'Messaging',    desc: 'Team communication & alerts',       connected: true,  calls: 612  },
    { id: 'hubspot',       name: 'HubSpot',       icon: '🔶',  cat: 'CRM',          desc: 'Marketing, sales & service hub',    connected: false, calls: 0    },
    { id: 'twilio',        name: 'Twilio',        icon: '📱',  cat: 'SMS',          desc: 'SMS & voice communications',        connected: false, calls: 0    },
    { id: 'google_sheets', name: 'Google Sheets', icon: '📊',  cat: 'Productivity', desc: 'Spreadsheet data sync',             connected: true,  calls: 221  },
    { id: 'jira',          name: 'Jira',          icon: '🎫',  cat: 'Project Mgmt', desc: 'Issue tracking & agile boards',     connected: false, calls: 0    },
    { id: 'zendesk',       name: 'Zendesk',       icon: '🎧',  cat: 'Support',      desc: 'Customer support platform',         connected: false, calls: 0    },
  ],

  // Per-tenant connection state for integrations
  // tenantId -> { [integrationId]: { connected, calls } }
  tenantIntegrations: {},

  tenants: [
    { id: 'techcorp',  name: 'TechCorp Inc.',       users: 3, workflows: 5, plan: 'Enterprise', status: 'active', since: 'Jan 2024' },
    { id: 'globalent', name: 'GlobalEnt Solutions', users: 1, workflows: 2, plan: 'Pro',        status: 'active', since: 'Mar 2024' },
    { id: 'startupco', name: 'StartupCo',           users: 2, workflows: 1, plan: 'Starter',    status: 'trial',  since: 'Apr 2024' },
  ],

  // Active sessions (token -> { userId, tenant, expiresAt, createdAt })
  sessions: {},

  // Session TTL used across the backend
  SESSION_TTL_MS,
};

module.exports = store;

// engine/workflowEngine.js - Event-Driven Workflow Execution Engine
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');

const ACTIONS_META = {
  send_email:     { label: 'Send Email',          delay: [100, 300] },
  send_sms:       { label: 'Send SMS',            delay: [80,  200] },
  update_crm:     { label: 'Update CRM',          delay: [150, 400] },
  create_task:    { label: 'Create Task',         delay: [100, 250] },
  send_slack:     { label: 'Send Slack Message',  delay: [50,  150] },
  update_sheet:   { label: 'Update Spreadsheet',  delay: [200, 500] },
  webhook:        { label: 'Call Webhook',        delay: [100, 600] },
  add_tag:        { label: 'Add Tag',             delay: [50,  100] },
  create_invoice: { label: 'Create Invoice',      delay: [200, 400] },
  notify_team:    { label: 'Notify Team',         delay: [50,  150] },
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Simulate executing a single action
async function executeAction(actionId, payload) {
  const meta = ACTIONS_META[actionId] || { label: actionId, delay: [100, 300] };
  const [min, max] = meta.delay;
  await sleep(randomInt(min, max));

  // 5% simulated failure per action
  if (Math.random() < 0.05) {
    throw new Error(`${meta.label}: API timeout (simulated)`);
  }

  return { action: meta.label, result: `${meta.label} completed successfully`, ts: Date.now() };
}

// Execute a full workflow
async function executeWorkflow(workflow, eventPayload) {
  const t0 = Date.now();
  const results = [];
  let attempt = 0;
  const maxAttempts = workflow.retryEnabled ? workflow.maxRetries + 1 : 1;

  while (attempt < maxAttempts) {
    try {
      // Execute each action in sequence
      for (const actionId of workflow.actions) {
        const result = await executeAction(actionId, eventPayload);
        results.push(result);
      }

      const duration = Date.now() - t0;
      const actionLabels = workflow.actions.map(a => ACTIONS_META[a]?.label || a).join(', ');
      const log = {
        id: uuidv4(),
        wf: workflow.id,
        wfName: workflow.name,
        trigger: workflow.trigger,
        status: 'success',
        msg: `[${eventPayload.trigger}] Actions executed: ${actionLabels}. Payload: ${JSON.stringify(eventPayload.data).slice(0, 80)}`,
        duration,
        ts: Date.now(),
        attempt: attempt + 1,
        results,
      };
      store.logs.unshift(log);
      // Keep logs to 500
      if (store.logs.length > 500) store.logs = store.logs.slice(0, 500);

      // Update workflow stats
      const wfIdx = store.workflows.findIndex(w => w.id === workflow.id);
      if (wfIdx !== -1) {
        store.workflows[wfIdx].runs++;
        store.workflows[wfIdx].lastRun = Date.now();
        // Recalculate success rate
        const allWfLogs = store.logs.filter(l => l.wf === workflow.id);
        const successCount = allWfLogs.filter(l => l.status === 'success').length;
        store.workflows[wfIdx].successRate = Math.round((successCount / allWfLogs.length) * 100);
      }

      return { success: true, log };

    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        const log = {
          id: uuidv4(),
          wf: workflow.id,
          wfName: workflow.name,
          trigger: workflow.trigger,
          status: 'error',
          msg: `Failed after ${attempt} attempt(s): ${err.message}`,
          duration: Date.now() - t0,
          ts: Date.now(),
          attempt,
          results,
        };
        store.logs.unshift(log);
        if (store.logs.length > 500) store.logs = store.logs.slice(0, 500);
        return { success: false, log };
      }
      // Wait before retry
      await sleep(500 * attempt);
    }
  }
}

// Main trigger function - finds and executes all matching active workflows
async function triggerEvent(triggerType, data, tenant) {
  const matchingWorkflows = store.workflows.filter(
    w => w.trigger === triggerType && w.status === 'active' && w.tenant === tenant
  );

  if (matchingWorkflows.length === 0) {
    return { triggered: 0, results: [], message: `No active workflows for trigger: ${triggerType}` };
  }

  const eventPayload = { trigger: triggerType, data, ts: Date.now() };

  // Execute all matching workflows (event-driven, parallel)
  const promises = matchingWorkflows.map(wf => executeWorkflow(wf, eventPayload));
  const results = await Promise.all(promises);

  return {
    triggered: matchingWorkflows.length,
    results: results.map(r => ({ wfId: r.log.wf, wfName: r.log.wfName, status: r.log.status, logId: r.log.id })),
    message: `${matchingWorkflows.length} workflow(s) executed for trigger: ${triggerType}`,
  };
}

module.exports = { triggerEvent, executeWorkflow };

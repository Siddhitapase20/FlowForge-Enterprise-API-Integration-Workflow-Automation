// routes/workflows.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const store = require('../data/store');
const { auth, managerOrAbove } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// GET /api/workflows - list workflows for user's tenant
router.get('/', auth, (req, res) => {
  const wfs = store.workflows.filter(w => w.tenant === req.user.tenant);
  res.json(wfs);
});

// GET /api/workflows/:id
router.get('/:id', auth, (req, res) => {
  const wf = store.workflows.find(w => w.id === req.params.id && w.tenant === req.user.tenant);
  if (!wf) return res.status(404).json({ error: 'Workflow not found.' });
  res.json(wf);
});

// POST /api/workflows - create workflow
router.post('/',
  auth,
  managerOrAbove,
  body('name').isString().isLength({ min: 1 }).withMessage('name is required.'),
  body('trigger').isString().isLength({ min: 1 }).withMessage('trigger is required.'),
  body('actions').isArray({ min: 1 }).withMessage('actions must be a non-empty array.'),
  body('retryEnabled').optional().isBoolean().withMessage('retryEnabled must be boolean.'),
  body('maxRetries').optional().isInt({ min: 0, max: 10 }).withMessage('maxRetries must be an int between 0 and 10.'),
  validate,
  (req, res) => {
  const { name, description, trigger, actions, condition, retryEnabled, maxRetries } = req.body;
  const wf = {
    id: 'wf_' + uuidv4().slice(0, 8),
    name, description: description || '', trigger, actions,
    condition: condition || 'always',
    retryEnabled: retryEnabled === true,
    maxRetries: Number.isFinite(maxRetries) ? Number(maxRetries) : 0,
    status: 'active',
    tenant: req.user.tenant,
    createdBy: req.user.name,
    runs: 0, successRate: 100,
    lastRun: null,
    createdAt: Date.now(),
  };
  store.workflows.push(wf);
  res.status(201).json(wf);
});

// PATCH /api/workflows/:id - update (toggle status, rename, etc.)
router.patch('/:id',
  auth,
  managerOrAbove,
  body('name').optional().isString().isLength({ min: 1 }).withMessage('name must be a non-empty string.'),
  body('description').optional().isString().withMessage('description must be a string.'),
  body('status').optional().isIn(['active', 'paused']).withMessage('status must be active|paused.'),
  body('retryEnabled').optional().isBoolean().withMessage('retryEnabled must be boolean.'),
  body('maxRetries').optional().isInt({ min: 0, max: 10 }).withMessage('maxRetries must be an int between 0 and 10.'),
  body('condition').optional().isString().withMessage('condition must be a string.'),
  validate,
  (req, res) => {
  const idx = store.workflows.findIndex(w => w.id === req.params.id && w.tenant === req.user.tenant);
  if (idx === -1) return res.status(404).json({ error: 'Workflow not found.' });
  const allowed = ['name', 'description', 'status', 'retryEnabled', 'maxRetries', 'condition'];
  allowed.forEach(k => { if (req.body[k] !== undefined) store.workflows[idx][k] = req.body[k]; });
  res.json(store.workflows[idx]);
});

// DELETE /api/workflows/:id
router.delete('/:id', auth, managerOrAbove, (req, res) => {
  const idx = store.workflows.findIndex(w => w.id === req.params.id && w.tenant === req.user.tenant);
  if (idx === -1) return res.status(404).json({ error: 'Workflow not found.' });
  store.workflows.splice(idx, 1);
  res.json({ message: 'Workflow deleted.' });
});

module.exports = router;

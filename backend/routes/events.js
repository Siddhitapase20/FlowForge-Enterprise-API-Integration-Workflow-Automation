// routes/events.js - Event simulation endpoint
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { triggerEvent } = require('../engine/workflowEngine');

// POST /api/events/trigger
router.post('/trigger',
  auth,
  body('trigger').isString().isLength({ min: 1 }).withMessage('trigger is required.'),
  validate,
  async (req, res) => {
    const { trigger, data } = req.body;
  try {
    const result = await triggerEvent(trigger, data || {}, req.user.tenant);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Customer Routes — customer list and detail
const express = require('express');
const router = express.Router();
const svc = require('../advisorDataService');

// GET /api/v1/advisor/customers
router.get('/customers', async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await svc.listCustomers(search, parseInt(page) || 1, parseInt(limit) || 20);
    res.json(result);
  } catch (err) {
    console.error('[advisor/customers]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/advisor/customers/:id
router.get('/customers/:id', async (req, res) => {
  try {
    const detail = await svc.getCustomerDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: 'Customer not found' });
    res.json(detail);
  } catch (err) {
    console.error('[advisor/customers/:id]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/advisor/customers/:id/timeline
router.get('/customers/:id/timeline', async (req, res) => {
  try {
    const events = await svc.getCustomerTimeline(req.params.id);
    res.json({ customerId: req.params.id, events });
  } catch (err) {
    console.error('[advisor/customers/:id/timeline]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

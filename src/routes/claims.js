const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { fileClaim, getClaims, getAllClaims, getClaim, updateClaimStatus } = require('../services/claimsService');

const auditLogId = () => 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

const requireAdminOrSales = (req, res, next) => {
  if (req.user && ['admin', 'sales'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

router.post('/', authenticate, requireAdminOrSales, async (req, res, next) => {
  try {
    const { lead_id, policy_id, claim_type, description, amount_claimed, documents } = req.body;
    if (!lead_id || !claim_type) return res.status(400).json({ error: 'lead_id and claim_type required' });
    const result = await fileClaim(lead_id, { policy_id, claim_type, description, amount_claimed, documents });
    await run('INSERT INTO activities (lead_id, title, description, type) VALUES (?, ?, ?, ?)',
      [lead_id, `Claim filed: ${result.claim_number}`, `${claim_type} - ${description || ''}`, 'claim']);
    await run('INSERT INTO audit_logs (id, event_type, entity_type, entity_id, actor_id, metadata) VALUES (?, ?, ?, ?, ?, ?)',
      [auditLogId(), 'claim.created', 'claim', String(result.id), req.user.id, JSON.stringify({ claim_number: result.claim_number, claim_type })]);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.get('/', authenticate, requireAdminOrSales, async (req, res, next) => {
  try {
    const claims = await getAllClaims(req.query);
    res.json(claims);
  } catch (err) { next(err); }
});

router.get('/lead/:leadId', authenticate, async (req, res, next) => {
  try {
    const claims = await getClaims(req.params.leadId);
    res.json(claims);
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const claim = await getClaim(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) { next(err); }
});

router.put('/:id/status', authenticate, requireAdminOrSales, async (req, res, next) => {
  try {
    const { status, amount_approved, notes } = req.body;
    const validStatuses = ['filed', 'under_review', 'document_requested', 'approved', 'settled', 'declined'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const result = await updateClaimStatus(req.params.id, status, { amount_approved, notes });
    await run('INSERT INTO activities (lead_id, title, description, type) VALUES (?, ?, ?, ?)',
      [result.lead_id, `Claim ${result.claim_number} updated`, `Status changed to ${status}`, 'claim']);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
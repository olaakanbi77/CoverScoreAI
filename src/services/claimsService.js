const { run, get, all } = require('../config/database');

async function generateClaimNumber() {
  const last = await get("SELECT claim_number FROM claims ORDER BY id DESC LIMIT 1");
  const num = last ? parseInt(last.claim_number.split('-')[1]) + 1 : 1001;
  return `CLM-${num}`;
}

async function fileClaim(leadId, { policy_id, claim_type, description, amount_claimed, documents }) {
  const claimNumber = await generateClaimNumber();
  const result = await run(
    `INSERT INTO claims (claim_number, lead_id, policy_id, claim_type, description, amount_claimed, documents, status, filed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'filed', datetime('now'))`,
    [claimNumber, leadId, policy_id || null, claim_type, description, amount_claimed || 0, JSON.stringify(documents || [])]
  );
  return { id: result.lastInsertRowid, claim_number: claimNumber };
}

async function getClaims(leadId) {
  return all('SELECT * FROM claims WHERE lead_id = ? ORDER BY filed_at DESC', [leadId]);
}

async function getAllClaims(filters = {}) {
  let sql = 'SELECT c.*, l.name as client_name, l.business_name, p.policy_number FROM claims c JOIN leads l ON c.lead_id = l.id LEFT JOIN policies p ON c.policy_id = p.id';
  const conditions = [];
  const params = [];
  if (filters.status) { conditions.push('c.status = ?'); params.push(filters.status); }
  if (filters.leadId) { conditions.push('c.lead_id = ?'); params.push(filters.leadId); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY c.filed_at DESC';
  return all(sql, params);
}

async function getClaim(id) {
  return get('SELECT c.*, l.name as client_name, l.business_name, l.phone, l.email, p.policy_number, p.product FROM claims c JOIN leads l ON c.lead_id = l.id LEFT JOIN policies p ON c.policy_id = p.id WHERE c.id = ?', [id]);
}

async function updateClaimStatus(id, status, { amount_approved, notes } = {}) {
  const setters = ["status = ?", "updated_at = datetime('now')"];
  const params = [status];
  if (amount_approved !== undefined) { setters.push('amount_approved = ?'); params.push(amount_approved); }
  if (notes !== undefined) { setters.push('notes = ?'); params.push(notes); }
  if (status === 'settled') { setters.push("settled_at = datetime('now')"); }
  params.push(id);
  await run(`UPDATE claims SET ${setters.join(', ')} WHERE id = ?`, params);
  return getClaim(id);
}

const STATUSES = ['filed', 'under_review', 'document_requested', 'approved', 'settled', 'declined'];

module.exports = { fileClaim, getClaims, getAllClaims, getClaim, updateClaimStatus, STATUSES };
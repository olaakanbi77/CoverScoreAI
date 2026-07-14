const db = require('../config/database');
const ns = require('./notificationServer');

async function notify(userId, type, title, message, link, metadata) {
  if (!db || !ns) return;

  const sql = `INSERT INTO notifications (user_id, type, title, message, link, metadata, created_at, is_read)
               VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 0)`;
  db.run(sql, [userId, type, title, message, link, metadata ? JSON.stringify(metadata) : null], (err) => {
    if (err) {
      console.error('[notify] DB error:', err.message);
      return;
    }
    ns.sendToUser(userId, {
      type: 'notification',
      notification: { id: Date.now(), type, title, message, link, created_at: new Date().toISOString() }
    });
  });
}

async function notifyRole(role, type, title, message, link, metadata) {
  if (!db || !ns) return;

  const sql = `INSERT INTO notifications (user_id, type, title, message, link, metadata, created_at, is_read)
               SELECT id, ?, ?, ?, ?, ?, datetime('now'), 0 FROM users WHERE role = ?`;
  db.run(sql, [type, title, message, link, metadata ? JSON.stringify(metadata) : null, role], (err) => {
    if (err) {
      console.error('[notify] DB error:', err.message);
      return;
    }
    ns.sendToRole(role, {
      type: 'notification',
      notification: { id: Date.now(), type, title, message, link, created_at: new Date().toISOString() }
    });
  });
}

module.exports = { notify, notifyRole };

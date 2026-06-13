const express = require('express');
const multer = require('multer');
const { run, all, get } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAgent } = require('../middleware/rbac');
const s3Service = require('../services/s3Service');

const router = express.Router();

// Use memory storage for multer since we stream directly to S3
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// GET /api/documents/:lead_id
router.get('/:lead_id', authenticate, requireAgent, async (req, res, next) => {
  try {
    const documents = await all(
      'SELECT * FROM documents WHERE lead_id = ? ORDER BY created_at DESC', 
      [req.params.lead_id]
    );

    res.json({ documents });
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/upload
router.post('/upload', authenticate, requireAgent, upload.single('file'), async (req, res, next) => {
  try {
    const { lead_id } = req.body;
    const file = req.file;

    if (!lead_id || !file) {
      return res.status(400).json({ error: 'lead_id and file are required' });
    }

    if (!s3Service.isConfigured()) {
      return res.status(500).json({ error: 'S3 Storage is not configured' });
    }

    // Upload to S3
    const { key } = await s3Service.uploadFile(
      file.buffer, 
      file.originalname, 
      file.mimetype, 
      `leads/${lead_id}`
    );

    // Save metadata to database
    await run(`
      INSERT INTO documents (lead_id, file_name, file_key, mime_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `, [lead_id, file.originalname, key, file.mimetype, req.user.id]);

    res.status(201).json({ success: true, message: 'Document uploaded successfully' });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// GET /api/documents/download/:id
router.get('/download/:id', authenticate, requireAgent, async (req, res, next) => {
  try {
    const doc = await get('SELECT file_key, file_name FROM documents WHERE id = ?', [req.params.id]);
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!s3Service.isConfigured()) {
      return res.status(500).json({ error: 'S3 Storage is not configured' });
    }

    // Generate presigned URL
    const url = await s3Service.getDownloadUrl(doc.file_key, 3600); // 1 hour expiration
    
    if (!url) {
      return res.status(500).json({ error: 'Failed to generate download link' });
    }

    // Redirect user to the presigned URL
    res.redirect(url);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticate, requireAgent, async (req, res, next) => {
  try {
    const doc = await get('SELECT file_key FROM documents WHERE id = ?', [req.params.id]);
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!s3Service.isConfigured()) {
      return res.status(500).json({ error: 'S3 Storage is not configured' });
    }

    // Delete from S3
    await s3Service.deleteFile(doc.file_key);

    // Delete from database
    await run('DELETE FROM documents WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { get } = require('../config/database');

router.get('/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    const report = await get('SELECT * FROM reports WHERE token = ?', [token]);
    
    if (!report) {
      return res.status(404).render('public/error', {
        layout: 'public/layout',
        message: 'Report not found or link has expired.'
      });
    }

    const now = new Date();
    const expiresAt = new Date(report.expires_at);

    if (now > expiresAt) {
      return res.status(410).render('public/error', {
        layout: 'public/layout',
        message: 'This report link has expired for security reasons. Please request a new assessment link.'
      });
    }

    const payload = JSON.parse(report.payload);
    
    // For template context
    const context = {
      ...payload,
      layout: false, // We will build a full standalone HTML layout for this
      is_critical: payload.score.band === 'Critical',
      is_vulnerable: payload.score.band === 'Vulnerable',
      is_moderate: payload.score.band === 'Moderate',
      is_stable: payload.score.band === 'Stable',
      is_strong: payload.score.band === 'Strong',
      
      score_color: payload.score.band === 'Critical' ? 'text-red-600' :
                   payload.score.band === 'Vulnerable' ? 'text-orange-500' :
                   payload.score.band === 'Moderate' ? 'text-yellow-500' :
                   payload.score.band === 'Stable' ? 'text-green-500' :
                   'text-emerald-600',
                   
      bg_color: payload.score.band === 'Critical' ? 'bg-red-50' :
                payload.score.band === 'Vulnerable' ? 'bg-orange-50' :
                payload.score.band === 'Moderate' ? 'bg-yellow-50' :
                payload.score.band === 'Stable' ? 'bg-green-50' :
                'bg-emerald-50'
    };

    if (report.template_code === 'family_protection_score_v1') {
      res.render('assessment/family-protection-report', context);
    } else {
      res.send("Unsupported report template.");
    }
    
  } catch (err) {
    console.error("Error retrieving report:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;

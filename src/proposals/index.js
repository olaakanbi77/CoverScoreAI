const { generateProposal } = require('./generator');

function createProposalRouter() {
  const router = require('express').Router();

  router.post('/api/proposals/generate', async (req, res) => {
    try {
      const { assessmentData, products, advisorInfo } = req.body;

      if (!assessmentData) {
        return res.status(400).json({ error: 'assessmentData is required' });
      }

      const result = generateProposal(assessmentData, products || [], advisorInfo);

      res.json(result);
    } catch (err) {
      console.error('Proposal generation error:', err);
      res.status(500).json({ error: 'Failed to generate proposal', details: err.message });
    }
  });

  router.get('/api/proposals/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const fs = require('fs');
      const path = require('path');
      const proposalDir = path.join(__dirname, '..', 'public', 'proposals');
      const htmlPath = path.join(proposalDir, `${id}.html`);
      const pdfPath = path.join(proposalDir, `${id}.pdf`);

      const metadata = {
        proposalNumber: id,
        exists: {
          html: fs.existsSync(htmlPath),
          pdf: fs.existsSync(pdfPath)
        },
        htmlUrl: `/proposals/${id}.html`,
        pdfUrl: `/proposals/${id}.pdf`,
        queriedAt: new Date().toISOString()
      };

      res.json(metadata);
    } catch (err) {
      console.error('Proposal lookup error:', err);
      res.status(500).json({ error: 'Failed to lookup proposal', details: err.message });
    }
  });

  return router;
}

module.exports = { generateProposal, createProposalRouter };

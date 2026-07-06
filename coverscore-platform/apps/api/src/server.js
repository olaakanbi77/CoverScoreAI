const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const assessmentRoutes = require('./routes/assessment');
const assessmentRoutesV1 = require('./routes/v1/assessment.routes');
const journeyRoutesV1 = require('./routes/v1/journey.routes');
const db = require('../../../database/schemas');

const app = express();
const PORT = process.env.API_PORT || 3017;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', service: 'coverscore-api', version: '1.0.0' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// Assessment Runtime endpoints
app.use('/assessment', assessmentRoutes);
app.use('/api/v1/assessment', assessmentRoutesV1);
app.use('/api/v1/journeys', journeyRoutesV1);

// Start server
app.listen(PORT, () => {
  console.log(`[api] CoverScore API running on port ${PORT}`);
  console.log(`[api] Health: http://localhost:${PORT}/health`);
  console.log(`[api] Assessment: POST /assessment/start, /reply, /report, /complete`);
  console.log(`[api] Assessment: GET /assessment/state/:id`);
});

module.exports = app;

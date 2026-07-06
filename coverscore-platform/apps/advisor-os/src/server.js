// Advisor OS — Server
// Standalone Express app serving advisor-facing APIs
// Consumes assessment data, journeys, scoring results

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const dashboardRoutes = require('./routes/dashboard');
const customersRoutes = require('./routes/customers');
const opportunitiesRoutes = require('./routes/opportunities');
const pipelineRoutes = require('./routes/pipeline');
const tasksRoutes = require('./routes/tasks');
const copilotRoutes = require('./routes/copilot');
const db = require('../../../database/schemas');

const app = express();
const PORT = process.env.ADVISOR_OS_PORT || 3018;

app.use(express.json());

// Health
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', service: 'advisor-os', version: '1.0.0' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// API routes
app.use('/api/v1/advisor', dashboardRoutes);
app.use('/api/v1/advisor', customersRoutes);
app.use('/api/v1/advisor', opportunitiesRoutes);
app.use('/api/v1/advisor', pipelineRoutes);
app.use('/api/v1/advisor', tasksRoutes);
app.use('/api/v1/advisor', copilotRoutes);

app.listen(PORT, () => {
  console.log(`[advisor-os] CoverScore Advisor OS running on port ${PORT}`);
  console.log(`[advisor-os] Health: http://localhost:${PORT}/health`);
});

module.exports = app;

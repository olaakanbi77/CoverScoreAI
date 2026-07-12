const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const app = require('./app');
const { initDatabase } = require('./config/database');
const { startCronJobs } = require('./services/automationEngine');

const PORT = process.env.PORT || 3016;

const startServer = () => {
  initDatabase();
  startCronJobs();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   CoverScore AI - Insurance Risk Intelligence Platform   ║
║                                                          ║
║   Server running on: http://localhost:${PORT}              ║
║                                                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
  });
};

startServer();

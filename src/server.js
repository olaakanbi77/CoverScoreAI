require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./config/database');

const PORT = process.env.PORT || 3016;

const startServer = () => {
  initDatabase();

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

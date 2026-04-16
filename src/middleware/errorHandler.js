const fs = require('fs');
const path = require('path');

const errorLogPath = path.join(__dirname, '../../logs/error.log');

const ensureLogDir = () => {
  const logDir = path.dirname(errorLogPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

const logError = (error) => {
  ensureLogDir();
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${error.stack || error}\n`;
  fs.appendFileSync(errorLogPath, logEntry);
};

const errorHandler = (err, req, res, next) => {
  logError(err);

  console.error('Server Error:', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', message: err.message });
  }

  if (err.name === 'SqliteError') {
    return res.status(500).json({ error: 'Database Error', message: 'A database error occurred' });
  }

  res.status(err.status || 500).json({
    error: err.status === 404 ? 'Not Found' : 'Internal Server Error',
    message: err.status === 404 ? 'The requested resource was not found' : 'An unexpected error occurred'
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} not found` });
};

module.exports = { errorHandler, notFoundHandler, logError };

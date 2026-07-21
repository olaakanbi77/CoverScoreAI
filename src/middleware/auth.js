const jwt = require('jsonwebtoken');
const { get } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'coverscore-jwt-secret-change-in-production';

const authenticate = async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get(`
      SELECT u.id, u.email, u.name, u.role, u.industry, u.meet_link,
             c.passport_id
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      WHERE u.id = ?
    `, [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
    }
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get(`
      SELECT u.id, u.email, u.name, u.role, u.industry, u.meet_link,
             c.passport_id
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      WHERE u.id = ?
    `, [decoded.userId]);
    if (user) {
      req.user = user;
      res.locals.user = user;
    }
  } catch (error) {
  }

  next();
};

const generateAccessToken = (userId, role = 'user') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || 'coverscore-refresh-secret-change-in-production', { expiresIn: '7d' });
};

const authenticatePage = async (req, res, next) => {
  const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  console.log('[auth] called:', req.originalUrl, 'hasToken:', !!token, 'cookies:', JSON.stringify(req.cookies || {}));

  if (!token) {
    console.log('[auth] no token found');
    return res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
    console.log('[auth] jwt verify OK, decoded:', JSON.stringify(decoded));
  } catch (error) {
    console.log('[auth] token verification failed:', error.message);
    res.clearCookie('accessToken');
    return res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }

  console.log('[auth] starting DB query for userId:', decoded.userId);

  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), ms));

  try {
    const startTime = Date.now();
    const user = await Promise.race([
      get(`
        SELECT u.id, u.email, u.name, u.role, u.industry, u.meet_link,
               c.passport_id
        FROM users u
        LEFT JOIN customers c ON c.user_id = u.id
        WHERE u.id = ?
      `, [decoded.userId]),
      timeout(5000)
    ]);
    const elapsed = Date.now() - startTime;
    if (elapsed > 100) {
      console.warn(`[auth] Slow DB query (${elapsed}ms) for userId=${decoded.userId}, ip=${req.ip}`);
    }

    if (!user) {
      console.log('[auth] user not found in DB for userId:', decoded.userId);
      res.clearCookie('accessToken');
      return res.redirect('/auth/login');
    }

    console.log('[auth] DB query OK, user:', user.id, user.role);
    req.user = user;
    res.locals.user = user;
    next();
  } catch (error) {
    console.log('[auth] catch block, error:', error.message);
    if (error.message === 'DB_TIMEOUT') {
      console.error(`[auth] DB TIMEOUT after 5s for userId=${decoded.userId}, url=${req.originalUrl}, ip=${req.ip}`, new Error().stack);
    }
    res.clearCookie('accessToken');
    return res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
};

module.exports = { authenticate, optionalAuth, authenticatePage, generateAccessToken, generateRefreshToken };

const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { run, get } = require('../config/database');
const { authenticate, generateAccessToken, generateRefreshToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: errors.array()[0].msg });
      }

      const { email, password, name, phone, business_name, industry } = req.body;

      const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(400).json({ error: 'Bad Request', message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const result = await run(`
        INSERT INTO users (email, password_hash, name, phone, business_name, industry, role)
        VALUES (?, ?, ?, ?, ?, ?, 'user')
      `, [email, passwordHash, name, phone || null, business_name || null, industry || null]);

      const userId = result.lastInsertRowid;
      const accessToken = generateAccessToken(userId, 'user');
      const refreshToken = generateRefreshToken(userId);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await run('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [userId, refreshToken, expiresAt]);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.status(201).json({
        message: 'Registration successful',
        user: { id: userId, email, name, role: 'user' },
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: 'Invalid email or password' });
      }

      const { email, password } = req.body;

      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
      }

      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await run('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id]);
      await run('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, refreshToken, expiresAt]);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No refresh token' });
    }

    const storedToken = await get('SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > datetime("now")', [refreshToken]);
    if (!storedToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'coverscore-refresh-secret');

    const user = await get('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.userId]);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user.id, user.role);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.json({
      message: 'Token refreshed',
      user,
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
});

router.post('/password-reset',
  body('email').isEmail().normalizeEmail(),
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await get('SELECT id, email FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.json({ message: 'If the email exists, a reset link has been sent' });
      }

      const resetToken = generateAccessToken(user.id, 'user');

      await sendPasswordResetEmail(email, resetToken);

      res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/reset-password',
  body('password').isLength({ min: 8 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 8 characters' });
      }

      const { token, password } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Validation Error', message: 'Reset token is required' });
      }

      const jwt = require('jsonwebtoken');
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'coverscore-jwt-secret');
      } catch (err) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired reset token. Please request a new one.' });
      }

      const user = await get('SELECT id FROM users WHERE id = ?', [decoded.userId]);
      if (!user) {
        return res.status(404).json({ error: 'Not Found', message: 'User not found' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await run('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?', [passwordHash, user.id]);

      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/claim-admin', authenticate, async (req, res, next) => {
  try {
    const adminExists = await get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
    if (adminExists) {
      return res.status(403).json({ error: 'Forbidden', message: 'An admin already exists. Contact an existing admin to change your role.' });
    }
    await run('UPDATE users SET role = ? WHERE id = ?', ['admin', req.user.id]);
    const updatedUser = await get('SELECT id, email, name, role FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'You are now an admin', user: updatedUser });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

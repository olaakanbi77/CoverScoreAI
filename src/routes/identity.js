const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { run, get, all } = require('../config/database');
const { authenticate, optionalAuth, generateAccessToken, generateRefreshToken } = require('../middleware/auth');
const { sendOTPEmail } = require('../services/emailService');

const router = express.Router();

const generatePassportId = () => 'CSP-' + crypto.randomBytes(12).toString('hex').toUpperCase();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOrCreateCustomer = async (email, name) => {
  let customer = await get('SELECT * FROM customers WHERE email = ?', [email]);
  if (customer) return customer;

  const passportId = generatePassportId();
  const result = await run(
    'INSERT INTO customers (passport_id, email, full_name) VALUES (?, ?, ?)',
    [passportId, email, name || email.split('@')[0]]
  );
  return get('SELECT * FROM customers WHERE id = ?', [result.lastInsertRowid]);
};

const getPassportData = async (passportId) => {
  const customer = await get('SELECT * FROM customers WHERE passport_id = ?', [passportId]);
  if (!customer) return null;

  const assessments = await all(`
    SELECT a.id, a.score, a.risk_level, a.ai_report, a.created_at,
           l.business_name, l.entity_type, l.industry
    FROM assessments a
    LEFT JOIN leads l ON a.id = l.assessment_id
    WHERE a.id IN (
      SELECT assessment_id FROM leads WHERE passport_id = ?
      UNION
      SELECT assessment_id FROM leads WHERE email = ?
    )
    ORDER BY a.created_at DESC
  `, [passportId, customer.email]);

  const leads = await all(`
    SELECT id, name, business_name, email, phone, status, score, risk_level,
           entity_type, opportunity_type, industry, created_at
    FROM leads WHERE passport_id = ? OR email = ?
    ORDER BY created_at DESC
  `, [passportId, customer.email]);

  const policies = await all(`
    SELECT p.*, l.business_name, l.name as lead_name
    FROM policies p
    JOIN leads l ON p.lead_id = l.id
    WHERE l.passport_id = ? OR l.email = ?
    ORDER BY p.created_at DESC
  `, [passportId, customer.email]);

  const quotes = await all(`
    SELECT rq.*, rp.name as product_name, l.business_name
    FROM rating_quotes rq
    JOIN rating_products rp ON rq.product_code = rp.code
    JOIN leads l ON rq.lead_id = l.id
    WHERE l.passport_id = ? OR l.email = ?
    ORDER BY rq.created_at DESC
  `, [passportId, customer.email]);

  let scoreTrend = [];
  if (assessments.length >= 2) {
    scoreTrend = assessments.map(a => ({
      date: a.created_at,
      score: a.score,
      risk_level: a.risk_level
    })).reverse();
  }

  return {
    passportId: customer.passport_id,
    fullName: customer.full_name,
    email: customer.email,
    phone: customer.phone,
    profileImage: customer.profile_image,
    preferredAssessmentType: customer.preferred_assessment_type,
    totalAssessments: customer.total_assessments,
    lastScore: customer.last_score,
    lastRiskLevel: customer.last_risk_level,
    createdAt: customer.created_at,
    scoreTrend,
    assessments,
    leads,
    policies,
    quotes
  };
};

router.post('/otp/send',
  body('email').isEmail().normalizeEmail(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: 'Valid email is required' });
      }

      const { email } = req.body;

      await run('UPDATE otp_codes SET used_at = datetime("now") WHERE email = ? AND used_at IS NULL AND purpose = ?', [email, 'login']);

      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await run('INSERT INTO otp_codes (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)',
        [email, code, 'login', expiresAt]);

      const result = await sendOTPEmail(email, code);

      if (!result.success) {
        return res.json({ message: 'Unable to send email. Please check your email address and try again.', emailFailed: true });
      }

      res.json({ message: 'Verification code sent', email });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/otp/verify',
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: 'Valid email and code are required' });
      }

      const { email, code, name } = req.body;

      const otp = await get(
        'SELECT * FROM otp_codes WHERE email = ? AND code = ? AND purpose = ? AND used_at IS NULL AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1',
        [email, code, 'login']
      );

      if (!otp) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired verification code' });
      }

      await run('UPDATE otp_codes SET used_at = datetime("now") WHERE id = ?', [otp.id]);

      let user = await get('SELECT * FROM users WHERE email = ?', [email]);
      let isNewUser = false;

      if (!user) {
        const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
        const displayName = name || email.split('@')[0];
        const result = await run(
          'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
          [email, passwordHash, displayName, 'user']
        );
        user = await get('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
        isNewUser = true;
      }

      const customer = await getOrCreateCustomer(email, user.name);

      if (isNewUser) {
        await run('UPDATE customers SET user_id = ? WHERE id = ?', [user.id, customer.id]);
      }

      if (!customer.user_id && user) {
        await run('UPDATE customers SET user_id = ? WHERE id = ?', [user.id, customer.id]);
      }

      await run('UPDATE customers SET full_name = ?, updated_at = datetime("now") WHERE id = ?', [user.name, customer.id]);

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
        maxAge: 15 * 60 * 1000
      });

      res.json({
        message: isNewUser ? 'Account created and logged in' : 'Login successful',
        isNewUser,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          passportId: customer.passport_id
        },
        passportId: customer.passport_id,
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/passport', authenticate, async (req, res, next) => {
  try {
    const customer = await get('SELECT * FROM customers WHERE user_id = ?', [req.user.id]);
    if (!customer) {
      return res.status(404).json({ error: 'Not Found', message: 'No passport found. Complete an assessment first.' });
    }

    const passport = await getPassportData(customer.passport_id);
    if (!passport) {
      return res.status(404).json({ error: 'Not Found', message: 'Passport data unavailable' });
    }

    res.json(passport);
  } catch (error) {
    next(error);
  }
});

router.get('/passport/public/:passportId', async (req, res, next) => {
  try {
    const passport = await getPassportData(req.params.passportId);
    if (!passport) {
      return res.status(404).json({ error: 'Not Found', message: 'Passport not found' });
    }

    const publicProfile = {
      passportId: passport.passportId,
      fullName: passport.fullName,
      profileImage: passport.profileImage,
      totalAssessments: passport.totalAssessments,
      lastScore: passport.lastScore,
      lastRiskLevel: passport.lastRiskLevel,
      scoreTrend: passport.scoreTrend,
      assessments: passport.assessments.map(a => ({
        id: a.id,
        score: a.score,
        risk_level: a.risk_level,
        created_at: a.created_at,
        business_name: a.business_name
      }))
    };

    res.json(publicProfile);
  } catch (error) {
    next(error);
  }
});

router.post('/passport/claim', authenticate, async (req, res, next) => {
  try {
    const { leadId } = req.body;
    if (!leadId) {
      return res.status(400).json({ error: 'Validation Error', message: 'leadId is required' });
    }

    const customer = await get('SELECT * FROM customers WHERE user_id = ?', [req.user.id]);
    if (!customer) {
      return res.status(404).json({ error: 'Not Found', message: 'No passport found' });
    }

    const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) {
      return res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
    }

    const leadCustomer = await get('SELECT * FROM customers WHERE lead_id = ?', [leadId]);
    if (leadCustomer && leadCustomer.id !== customer.id) {
      return res.status(409).json({ error: 'Conflict', message: 'This lead is already linked to another passport' });
    }

    await run('UPDATE leads SET passport_id = ? WHERE id = ?', [customer.passport_id, leadId]);

    if (!customer.lead_id) {
      await run('UPDATE customers SET lead_id = ?, total_assessments = total_assessments + 1, updated_at = datetime("now") WHERE id = ?',
        [leadId, customer.id]);
    }

    if (lead.score) {
      await run('UPDATE customers SET last_score = ?, last_risk_level = ?, total_assessments = total_assessments + 1, updated_at = datetime("now") WHERE id = ?',
        [lead.score, lead.risk_level, customer.id]);
    }

    res.json({ message: 'Lead claimed successfully', passportId: customer.passport_id });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const customer = await get('SELECT * FROM customers WHERE user_id = ?', [req.user.id]);
    const user = req.user;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        industry: user.industry
      },
      passport: customer ? {
        passportId: customer.passport_id,
        totalAssessments: customer.total_assessments,
        lastScore: customer.last_score,
        lastRiskLevel: customer.last_risk_level
      } : null
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authenticate,
  body('name').optional().trim(),
  async (req, res, next) => {
    try {
      const { name, phone, business_name, industry, preferred_assessment_type } = req.body;

      const updates = [];
      const params = [];

      if (name) { updates.push('name = ?'); params.push(name); }
      if (phone) { updates.push('phone = ?'); params.push(phone); }
      if (business_name) { updates.push('business_name = ?'); params.push(business_name); }
      if (industry) { updates.push('industry = ?'); params.push(industry); }

      if (updates.length > 0) {
        updates.push('updated_at = datetime("now")');
        params.push(req.user.id);
        await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      if (preferred_assessment_type) {
        await run('UPDATE customers SET preferred_assessment_type = ?, full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = datetime("now") WHERE user_id = ?',
          [preferred_assessment_type, name, phone, req.user.id]);
      } else if (name || phone) {
        await run('UPDATE customers SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = datetime("now") WHERE user_id = ?',
          [name, phone, req.user.id]);
      }

      res.json({ message: 'Profile updated' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

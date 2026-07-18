const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { getTemplates, getTemplate, createSurvey, getSurveys, getAllSurveys, getSurvey, updateSurvey } = require('../services/surveyService');

const requireAdminOrSales = (req, res, next) => {
  if (req.user && ['admin', 'sales'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

router.get('/templates', authenticate, async (req, res, next) => {
  try {
    const templates = await getTemplates();
    res.json(templates.map(t => ({ ...t, questions: JSON.parse(t.questions || '[]') })));
  } catch (err) { next(err); }
});

router.get('/templates/:id', authenticate, async (req, res, next) => {
  try {
    const tpl = await getTemplate(req.params.id);
    if (!tpl) return res.status(404).json({ error: 'Template not found' });
    res.json(tpl);
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdminOrSales, async (req, res, next) => {
  try {
    const { lead_id, session_id, type, surveyor_id, scheduled_at, template_id } = req.body;
    if (!lead_id) return res.status(400).json({ error: 'lead_id required' });
    const survey = await createSurvey(lead_id, { session_id, type, surveyor_id, scheduled_at, template_id });
    await run('INSERT INTO activities (lead_id, title, description, type) VALUES (?, ?, ?, ?)',
      [lead_id, 'Risk survey scheduled', `${type || 'site_inspection'} survey created`, 'survey']);
    res.status(201).json(survey);
  } catch (err) { next(err); }
});

router.get('/lead/:leadId', authenticate, async (req, res, next) => {
  try {
    const surveys = await getSurveys(req.params.leadId, req.query);
    res.json(surveys);
  } catch (err) { next(err); }
});

router.get('/', authenticate, requireAdminOrSales, async (req, res, next) => {
  try {
    const surveys = await getAllSurveys();
    res.json(surveys);
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const survey = await getSurvey(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    if (typeof survey.answers === 'string') survey.answers = JSON.parse(survey.answers);
    res.json(survey);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, requireAdminOrSales, async (req, res, next) => {
  try {
    const { answers, report, status } = req.body;
    const survey = await updateSurvey(req.params.id, { answers, report, status });
    res.json(survey);
  } catch (err) { next(err); }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const DailySession = require('../models/DailySession');
const { authenticateToken } = require('../middleware/auth');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// @route  GET /api/session/today?date=YYYY-MM-DD
// @desc   Load the user's guided session for the given (user-local) day
// @access Private
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const date = req.query.date;
    if (!DATE_RE.test(date || '')) {
      return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required', error: 'BAD_DATE' });
    }
    const session = await DailySession.findOne({ userId: req.user._id, date });
    res.json({ session });
  } catch (e) {
    console.error('❌ Session GET error:', e);
    res.status(500).json({ message: 'Failed to load session', error: 'SESSION_ERROR' });
  }
});

// @route  PUT /api/session/today
// @desc   Upsert the whole day-session state (steps, baselines, completion).
//         Idempotent full-state writes keep this crash-safe: the client can
//         save after every transition and resume from anywhere.
// @access Private
router.put('/today', authenticateToken, async (req, res) => {
  try {
    const { date, steps, completedAt } = req.body || {};
    if (!DATE_RE.test(date || '')) {
      return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required', error: 'BAD_DATE' });
    }
    if (!Array.isArray(steps) || steps.length === 0 || steps.length > 6) {
      return res.status(400).json({ message: 'Invalid steps', error: 'BAD_STEPS' });
    }

    const cleanSteps = steps.map(s => ({
      id: String(s?.id || '').slice(0, 20),
      label: String(s?.label || '').slice(0, 120),
      target: String(s?.target || '').slice(0, 60),
      baseline: Math.max(0, parseInt(s?.baseline, 10) || 0),
      goal: Math.min(100, Math.max(1, parseInt(s?.goal, 10) || 1)),
      done: !!s?.done,
      doneAt: s?.doneAt ? new Date(s.doneAt) : null,
    }));

    const session = await DailySession.findOneAndUpdate(
      { userId: req.user._id, date },
      { $set: { steps: cleanSteps, completedAt: completedAt ? new Date(completedAt) : null } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ session });
  } catch (e) {
    console.error('❌ Session PUT error:', e);
    res.status(500).json({ message: 'Failed to save session', error: 'SESSION_ERROR' });
  }
});

module.exports = router;

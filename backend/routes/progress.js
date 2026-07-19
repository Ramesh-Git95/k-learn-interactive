const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/progress
// @desc    Get user's complete progress data
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const progressData = {
      progress: user.getProgress(),
      bookmarks: user.bookmarks,
      stats: user.progress.stats,
      level: user.progress.level,
      xp: user.progress.xp,
      streak: user.progress.streak,
      lastActiveDate: user.progress.lastActiveDate
    };

    res.json(progressData);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress
// @desc    Update user's progress data
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { progress, bookmarks } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update progress if provided
    if (progress) {
      await user.updateProgress(progress);
    }

    // Update bookmarks if provided
    if (bookmarks && Array.isArray(bookmarks)) {
      // Replace all bookmarks with new ones
      user.bookmarks = bookmarks.map(bookmark => ({
        ...bookmark,
        dateAdded: bookmark.dateAdded || new Date()
      }));
      await user.save();
    }

    // Update last active date
    user.progress.lastActiveDate = new Date();
    await user.save();

    const updatedProgressData = {
      progress: user.getProgress(),
      bookmarks: user.bookmarks,
      stats: user.progress.stats,
      level: user.progress.level,
      xp: user.progress.xp,
      streak: user.progress.streak,
      lastActiveDate: user.progress.lastActiveDate
    };

    res.json(updatedProgressData);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/progress/item
// @desc    Update a single progress item
// @access  Private
router.patch('/item', authenticateToken, async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || typeof value !== 'boolean') {
      return res.status(400).json({ message: 'Key and boolean value are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update single progress item
    user.progress.items[key] = value;
    
    // Mark the progress field as modified so MongoDB knows to save it
    user.markModified('progress.items');
    
    user.calculateStats();
    user.progress.lastActiveDate = new Date();
    await user.save();

    res.json({
      key,
      value,
      stats: user.progress.stats,
      xp: user.progress.xp
    });
  } catch (error) {
    console.error('❌ Error updating progress item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress/bookmark
// @desc    Add a bookmark
// @access  Private
router.post('/bookmark', authenticateToken, async (req, res) => {
  try {
    const bookmark = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.addBookmark(bookmark);

    res.json({
      bookmarks: user.bookmarks,
      message: 'Bookmark added successfully'
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/progress/bookmark/:korean
// @desc    Remove a bookmark
// @access  Private
router.delete('/bookmark/:korean', authenticateToken, async (req, res) => {
  try {
    const { korean } = req.params;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.removeBookmark(korean);

    res.json({
      bookmarks: user.bookmarks,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress/sync
// @desc    Sync localStorage data to MongoDB (one-time migration)
// @access  Private
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { localProgress, localBookmarks } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only sync if user has no existing progress
    const hasExistingProgress = user.progress.items.size > 0 || user.bookmarks.length > 0;
    
    if (hasExistingProgress) {
      return res.json({
        message: 'User already has progress data. Sync skipped.',
        progress: user.getProgress(),
        bookmarks: user.bookmarks
      });
    }

    // Sync localStorage progress to MongoDB
    if (localProgress) {
      await user.updateProgress(localProgress);
    }

    // Sync localStorage bookmarks to MongoDB
    if (localBookmarks && Array.isArray(localBookmarks)) {
      user.bookmarks = localBookmarks.map(bookmark => ({
        ...bookmark,
        dateAdded: new Date()
      }));
      await user.save();
    }

    res.json({
      message: 'Progress synced successfully',
      progress: user.getProgress(),
      bookmarks: user.bookmarks,
      stats: user.progress.stats
    });
  } catch (error) {
    console.error('Error syncing progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/progress/stats
// @desc    Get user learning statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = {
      ...user.progress.stats,
      level: user.progress.level,
      xp: user.progress.xp,
      streak: user.progress.streak,
      lastActiveDate: user.progress.lastActiveDate,
      totalBookmarks: user.bookmarks.length,
      joinedDate: user.createdAt
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Gamification (XP, streak, study heatmap) ─────────────────────────────────
// These used to live in localStorage only, so the numbers followed the browser
// instead of the account. The DB is now the source of truth; the client keeps a
// localStorage mirror purely for instant UI and guest mode.

const MAX_STUDY_DATES = 180;   // ~6 months — matches the dashboard heatmap
const MAX_XP_PER_CALL = 500;   // sanity bound on a single award

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// Shift a 'YYYY-MM-DD' string by whole days. Uses UTC internally so the
// arithmetic never drifts, while the string itself stays the user's local day.
function shiftDay(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

// Current streak = consecutive days ending today (or yesterday — the day isn't
// lost until it's actually missed, so an evening study session still counts).
function computeCurrentStreak(dates, today) {
  const set = new Set(dates);
  let cursor = today;
  if (!set.has(cursor)) {
    cursor = shiftDay(today, -1);
    if (!set.has(cursor)) return 0;
  }
  let n = 0;
  while (set.has(cursor)) { n++; cursor = shiftDay(cursor, -1); }
  return n;
}

// Longest run anywhere in the history — recomputed from the merged dates so a
// second device's history can extend a streak retroactively.
function computeLongestStreak(dates) {
  const sorted = [...new Set(dates)].sort();
  let best = 0, run = 0, prev = null;
  for (const day of sorted) {
    run = prev && shiftDay(prev, 1) === day ? run + 1 : 1;
    if (run > best) best = run;
    prev = day;
  }
  return best;
}

function normaliseDates(list) {
  return [...new Set((list || []).filter(d => typeof d === 'string' && ISO_DAY.test(d)))]
    .sort()
    .slice(-MAX_STUDY_DATES);
}

function shape(g) {
  return {
    xp: g.xp || 0,
    currentStreak: g.currentStreak || 0,
    longestStreak: g.longestStreak || 0,
    lastStudyDate: g.lastStudyDate || '',
    studyDates: g.studyDates || [],
    achievements: g.achievements || []
  };
}

// @route   GET /api/progress/gamification
// @desc    Read the account's XP / streak / heatmap
// @access  Private
router.get('/gamification', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('gamification');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(shape(user.gamification || {}));
  } catch (error) {
    console.error('Error fetching gamification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress/gamification/merge
// @desc    Reconcile this device's local values with the account (login / app open)
// @access  Private
// Merge-up, never overwrite: XP takes the higher value and study dates are
// UNIONED, so a device whose localStorage is empty can't wipe the account, and a
// device holding pre-sync history donates it instead of losing it.
router.post('/gamification/merge', authenticateToken, async (req, res) => {
  try {
    const { xp, studyDates, achievements, today } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const g = user.gamification || {};
    const day = ISO_DAY.test(today || '') ? today : new Date().toISOString().slice(0, 10);

    const localXp = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
    const mergedDates = normaliseDates([...(g.studyDates || []), ...(studyDates || [])]);

    user.gamification = {
      xp: Math.max(g.xp || 0, localXp),
      studyDates: mergedDates,
      currentStreak: computeCurrentStreak(mergedDates, day),
      longestStreak: computeLongestStreak(mergedDates),
      lastStudyDate: mergedDates[mergedDates.length - 1] || '',
      achievements: [...new Set([...(g.achievements || []), ...(achievements || []).filter(a => typeof a === 'string')])]
    };

    await user.save();
    res.json(shape(user.gamification));
  } catch (error) {
    console.error('Error merging gamification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress/gamification/xp
// @desc    Award XP atomically
// @access  Private
// $inc rather than a write of the whole total, so two devices earning at once
// can't clobber each other's award.
router.post('/gamification/xp', authenticateToken, async (req, res) => {
  try {
    const raw = Number(req.body?.amount);
    if (!Number.isFinite(raw) || raw <= 0) {
      return res.status(400).json({ message: 'A positive amount is required' });
    }
    const amount = Math.min(Math.floor(raw), MAX_XP_PER_CALL);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { 'gamification.xp': amount } },
      { new: true, select: 'gamification' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(shape(user.gamification));
  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress/gamification/study-day
// @desc    Mark today as studied and recompute the streak server-side
// @access  Private
// `today` comes from the client because the day boundary that matters is the
// user's own — the server runs in UTC and would roll over at the wrong moment.
router.post('/gamification/study-day', authenticateToken, async (req, res) => {
  try {
    const { today } = req.body || {};
    if (!ISO_DAY.test(today || '')) {
      return res.status(400).json({ message: 'today must be YYYY-MM-DD' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const g = user.gamification || {};
    const alreadyCounted = (g.studyDates || []).includes(today);
    const dates = normaliseDates([...(g.studyDates || []), today]);

    user.gamification = {
      ...shape(g),
      studyDates: dates,
      currentStreak: computeCurrentStreak(dates, today),
      longestStreak: computeLongestStreak(dates),
      lastStudyDate: today
    };

    await user.save();
    res.json({ ...shape(user.gamification), firstToday: !alreadyCounted });
  } catch (error) {
    console.error('Error marking study day:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Exposed for unit testing the streak maths without standing up Mongo/auth.
module.exports._streak = { shiftDay, computeCurrentStreak, computeLongestStreak, normaliseDates };

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

module.exports = router;

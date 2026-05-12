const express = require('express');
const User = require('../models/User');
const SRSCard = require('../models/SRSCard');
const { authenticateToken, requirePremium } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get SRS card statistics
    const srsStats = await SRSCard.getUserStats(user._id);
    
    // Calculate streak
    const today = new Date();
    const lastActive = user.progress.lastActiveDate;
    let currentStreak = user.progress.streak;
    
    if (lastActive) {
      const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
      if (daysDiff > 1) {
        currentStreak = 0; // Reset streak if missed more than 1 day
      }
    }
    
    const stats = {
      user: {
        level: user.progress.level,
        xp: user.progress.xp,
        streak: currentStreak,
        joinDate: user.createdAt,
        lastActive: user.progress.lastActiveDate,
        subscription: {
          type: user.subscription.type,
          status: user.subscription.status,
          hasAccess: user.hasPremiumAccess()
        }
      },
      srs: {
        totalCards: srsStats.totalCards,
        dueCards: srsStats.dueCards,
        newCards: srsStats.newCards,
        averageAccuracy: Math.round(srsStats.avgAccuracy || 0),
        reviewsToday: user.progress.srsData.reviewsToday
      },
      progress: {
        completedLessons: user.progress.completedLessons.length,
        totalLessons: 50, // This would come from your lesson data
        completionRate: Math.round((user.progress.completedLessons.length / 50) * 100)
      }
    };
    
    res.json({
      message: 'User statistics retrieved successfully',
      stats
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      message: 'Failed to get user statistics',
      error: 'GET_STATS_ERROR'
    });
  }
});

// @route   POST /api/users/progress/lesson
// @desc    Mark lesson as completed
// @access  Private
router.post('/progress/lesson', authenticateToken, async (req, res) => {
  try {
    const { lessonId, xpGained = 0 } = req.body;
    const user = req.user;
    
    if (!lessonId) {
      return res.status(400).json({
        message: 'Lesson ID is required',
        error: 'MISSING_LESSON_ID'
      });
    }
    
    // Check if lesson already completed
    if (!user.progress.completedLessons.includes(lessonId)) {
      user.progress.completedLessons.push(lessonId);
      user.progress.xp += xpGained;
      
      // Update streak if this is a new day
      const today = new Date();
      const lastActive = user.progress.lastActiveDate;
      
      if (!lastActive || !isSameDay(today, lastActive)) {
        user.progress.streak += 1;
      }
      
      user.progress.lastActiveDate = today;
      await user.save();
      
      console.log(`📚 Lesson completed: ${lessonId} by ${user.email} (+${xpGained} XP)`);
    }
    
    res.json({
      message: 'Lesson progress updated successfully',
      progress: {
        completedLessons: user.progress.completedLessons.length,
        xp: user.progress.xp,
        streak: user.progress.streak,
        level: user.progress.level
      }
    });
    
  } catch (error) {
    console.error('Update lesson progress error:', error);
    res.status(500).json({
      message: 'Failed to update lesson progress',
      error: 'UPDATE_PROGRESS_ERROR'
    });
  }
});

// @route   POST /api/users/progress/xp
// @desc    Add XP to user
// @access  Private
router.post('/progress/xp', authenticateToken, async (req, res) => {
  try {
    const { amount, source = 'activity' } = req.body;
    const user = req.user;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Valid XP amount is required',
        error: 'INVALID_XP_AMOUNT'
      });
    }
    
    // Add XP
    user.progress.xp += amount;
    
    // Check for level up (every 1000 XP)
    const oldLevel = user.progress.level;
    const xpThresholds = {
      beginner: 1000,
      intermediate: 3000,
      advanced: 10000
    };
    
    let newLevel = 'beginner';
    if (user.progress.xp >= xpThresholds.advanced) {
      newLevel = 'advanced';
    } else if (user.progress.xp >= xpThresholds.intermediate) {
      newLevel = 'intermediate';
    }
    
    const leveledUp = oldLevel !== newLevel;
    if (leveledUp) {
      user.progress.level = newLevel;
    }
    
    user.progress.lastActiveDate = new Date();
    await user.save();
    
    console.log(`⭐ XP added: +${amount} for ${user.email} (source: ${source})`);
    
    res.json({
      message: 'XP added successfully',
      xp: {
        current: user.progress.xp,
        added: amount,
        level: user.progress.level,
        leveledUp
      }
    });
    
  } catch (error) {
    console.error('Add XP error:', error);
    res.status(500).json({
      message: 'Failed to add XP',
      error: 'ADD_XP_ERROR'
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard (top users by XP)
// @access  Private
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || 'all'; // all, week, month
    
    let dateFilter = {};
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { 'progress.lastActiveDate': { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { 'progress.lastActiveDate': { $gte: monthAgo } };
    }
    
    const topUsers = await User.find({
      isActive: true,
      ...dateFilter
    })
    .select('name progress.xp progress.level progress.streak createdAt')
    .sort({ 'progress.xp': -1 })
    .limit(limit);
    
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      xp: user.progress.xp,
      level: user.progress.level,
      streak: user.progress.streak,
      isCurrentUser: user._id.toString() === req.user._id.toString()
    }));
    
    res.json({
      message: 'Leaderboard retrieved successfully',
      leaderboard,
      timeframe,
      currentUserRank: leaderboard.findIndex(user => user.isCurrentUser) + 1 || null
    });
    
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      message: 'Failed to get leaderboard',
      error: 'GET_LEADERBOARD_ERROR'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    const user = req.user;
    
    if (!confirmPassword) {
      return res.status(400).json({
        message: 'Password confirmation is required',
        error: 'MISSING_PASSWORD_CONFIRMATION'
      });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(confirmPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'Incorrect password',
        error: 'INVALID_PASSWORD'
      });
    }
    
    // Delete user's SRS cards
    await SRSCard.deleteMany({ userId: user._id });
    
    // Delete user account
    await User.findByIdAndDelete(user._id);
    
    console.log(`🗑️ Account deleted: ${user.email}`);
    
    res.json({
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      message: 'Failed to delete account',
      error: 'DELETE_ACCOUNT_ERROR'
    });
  }
});

// @route   GET /api/users/daily-activity
// @desc    Get user's daily activity counts
// @access  Private
router.get('/daily-activity', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('📊 Daily activity request for user:', user.email);
    console.log('📅 User daily activity data:', user.progress.dailyActivity);
    
    const dailyActivity = user.getDailyActivity();
    console.log('📈 Computed daily activity:', dailyActivity);
    
    res.json({
      message: 'Daily activity retrieved successfully',
      dailyActivity
    });
    
  } catch (error) {
    console.error('Get daily activity error:', error);
    res.status(500).json({
      message: 'Failed to get daily activity',
      error: 'GET_DAILY_ACTIVITY_ERROR'
    });
  }
});

// @route   POST /api/users/daily-activity
// @desc    Track daily activity (quiz, vocabulary, phrases)
// @access  Private
router.post('/daily-activity', authenticateToken, async (req, res) => {
  try {
    const { activityType, count = 1 } = req.body;
    const user = req.user;
    
    if (!activityType || !['quiz', 'vocabulary', 'phrases'].includes(activityType)) {
      return res.status(400).json({
        message: 'Valid activity type is required (quiz, vocabulary, phrases)',
        error: 'INVALID_ACTIVITY_TYPE'
      });
    }
    
    const dailyActivity = user.trackDailyActivity(activityType, count);
    await user.save();
    
    console.log(`📊 Daily activity tracked: ${activityType} (+${count}) for ${user.email}`);
    
    res.json({
      message: 'Daily activity tracked successfully',
      dailyActivity
    });
    
  } catch (error) {
    console.error('Track daily activity error:', error);
    res.status(500).json({
      message: 'Failed to track daily activity',
      error: 'TRACK_ACTIVITY_ERROR'
    });
  }
});

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
  return date1.toDateString() === date2.toDateString();
}

module.exports = router;

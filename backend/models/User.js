const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Basic user information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  
  // Terms acceptance
  acceptedTermsAt: {
    type: Date
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // Email verification
  emailVerificationToken: {
    type: String,
    select: false // Don't include in queries by default
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  
  // Password reset (for future use)
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Subscription information
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing'],
      default: 'active'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  
  // Cross-device gamification — the authoritative store for XP, streak and the
  // study heatmap. The client mirrors this into localStorage for instant UI, but
  // this is the source of truth so the numbers follow the account, not the browser.
  // NOTE: deliberately separate from `progress.xp`, which calculateStats()
  // recomputes from lesson counts on every save and would clobber real XP.
  gamification: {
    xp: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    // 'YYYY-MM-DD' as observed in the user's own timezone — stored as a plain
    // string so a traveller's day boundary doesn't shift under them.
    lastStudyDate: {
      type: String,
      default: ''
    },
    // Rolling ~180 days of study days; feeds the dashboard heatmap.
    studyDates: {
      type: [String],
      default: []
    },
    achievements: {
      type: [String],
      default: []
    }
  },

  // Learning progress
  progress: {
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    xp: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    lastActiveDate: Date,
    completedLessons: [{
      type: String
    }],
    
    // Detailed progress tracking (matches frontend localStorage structure)
    items: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // Learning statistics
    stats: {
      totalWordsLearned: {
        type: Number,
        default: 0
      },
      totalTimeSpent: {
        type: Number,
        default: 0 // in minutes
      },
      sectionsCompleted: {
        type: Number,
        default: 0
      },
      quizzesTaken: {
        type: Number,
        default: 0
      },
      averageScore: {
        type: Number,
        default: 0
      }
    },
    
    // Daily activity tracking
    dailyActivity: {
      date: {
        type: Date,
        default: Date.now
      },
      quizzesTaken: {
        type: Number,
        default: 0
      },
      vocabularyStudied: {
        type: Number,
        default: 0
      },
      phrasesStudied: {
        type: Number,
        default: 0
      },
      aiChatsUsed: {
        type: Number,
        default: 0
      },
      aiTranslationsUsed: {
        type: Number,
        default: 0
      }
    },
    
    // SRS (Spaced Repetition System) data
    srsData: {
      totalCards: {
        type: Number,
        default: 0
      },
      reviewsToday: {
        type: Number,
        default: 0
      },
      accuracyRate: {
        type: Number,
        default: 0
      }
    }
  },
  
  // User bookmarks
  bookmarks: [{
    korean: String,
    english: String,
    romanization: String,
    type: {
      type: String,
      enum: ['vocabulary', 'phrase', 'grammar', 'culture'],
      default: 'vocabulary'
    },
    category: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      dailyReminder: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ 'subscription.stripeCustomerId': 1 });
userSchema.index({ createdAt: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Email verification methods
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  
  // Generate random token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and store in database
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set expiration (24 hours)
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  // Return unhashed token to send via email
  return verificationToken;
};

userSchema.methods.verifyEmailToken = function(token) {
  const crypto = require('crypto');
  
  // Hash the provided token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Check if token matches and hasn't expired
  return this.emailVerificationToken === hashedToken && 
         this.emailVerificationExpires > Date.now();
};

userSchema.methods.markEmailAsVerified = function() {
  this.emailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
  return this.save();
};

// Password reset methods
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};

// Instance method to check if user has premium access
userSchema.methods.hasPremiumAccess = function() {
  return this.subscription.type !== 'free' && 
         this.subscription.status === 'active' &&
         (!this.subscription.currentPeriodEnd || this.subscription.currentPeriodEnd > new Date());
};

// Instance method to get safe user data (without password)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Update last active date on login
userSchema.methods.updateLastActive = function() {
  this.progress.lastActiveDate = new Date();
  return this.save();
};

// Progress tracking methods
userSchema.methods.updateProgress = function(progressData) {
  // Merge new progress with existing
  this.progress.items = { ...this.progress.items, ...progressData };
  
  // Mark the progress field as modified so MongoDB saves it
  this.markModified('progress.items');
  
  // Update statistics based on progress
  this.calculateStats();
  return this.save();
};

userSchema.methods.getProgress = function() {
  // Return the progress object directly
  return this.progress.items || {};
};

userSchema.methods.calculateStats = function() {
  const progressItems = this.progress.items || {};
  
  // Count different types of completed items
  let wordsLearned = 0;
  let sectionsCompleted = 0;
  
  for (const [key, completed] of Object.entries(progressItems)) {
    if (completed) {
      if (key.startsWith('vocab_item_') || key.startsWith('phrase_') || key.startsWith('hangul_char_')) {
        wordsLearned++;
      } else if (key.startsWith('section_')) {
        sectionsCompleted++;
      }
    }
  }
  
  this.progress.stats.totalWordsLearned = wordsLearned;
  this.progress.stats.sectionsCompleted = sectionsCompleted;
  
  // Calculate XP based on progress
  this.progress.xp = (wordsLearned * 10) + (sectionsCompleted * 100);
};

userSchema.methods.addBookmark = function(bookmark) {
  // Check if bookmark already exists
  const exists = this.bookmarks.some(b => b.korean === bookmark.korean);
  if (!exists) {
    this.bookmarks.push(bookmark);
    return this.save();
  }
  return Promise.resolve(this);
};

userSchema.methods.removeBookmark = function(korean) {
  this.bookmarks = this.bookmarks.filter(b => b.korean !== korean);
  return this.save();
};

// Track daily activity (quiz attempts, vocabulary study, etc.)
userSchema.methods.trackDailyActivity = function(activityType, count = 1) {
  const today = new Date();
  const todayString = today.toDateString();
  const lastActivityDate = this.progress.dailyActivity.date ? this.progress.dailyActivity.date.toDateString() : null;
  
  // Reset daily counters if it's a new day
  if (lastActivityDate !== todayString) {
    this.progress.dailyActivity = {
      date: today,
      quizzesTaken: 0,
      vocabularyStudied: 0,
      phrasesStudied: 0,
      aiChatsUsed: 0,
      aiTranslationsUsed: 0
    };
  }

  // Increment the specific activity counter
  if (activityType === 'quiz') {
    this.progress.dailyActivity.quizzesTaken += count;
    this.progress.stats.quizzesTaken += count;
  } else if (activityType === 'vocabulary') {
    this.progress.dailyActivity.vocabularyStudied += count;
  } else if (activityType === 'phrases') {
    this.progress.dailyActivity.phrasesStudied += count;
  } else if (activityType === 'aiChat') {
    this.progress.dailyActivity.aiChatsUsed += count;
  } else if (activityType === 'aiTranslate') {
    this.progress.dailyActivity.aiTranslationsUsed += count;
  }
  
  return this.progress.dailyActivity;
};

// Get daily activity counts
userSchema.methods.getDailyActivity = function() {
  const today = new Date().toDateString();
  const lastActivityDate = this.progress.dailyActivity.date ? this.progress.dailyActivity.date.toDateString() : null;
  
  console.log('🗓️  Date comparison:', {
    today,
    lastActivityDate,
    isNewDay: lastActivityDate !== today,
    rawDate: this.progress.dailyActivity.date,
    rawActivity: this.progress.dailyActivity
  });
  
  // If it's a new day, return zeros
  if (lastActivityDate !== today) {
    console.log('🆕 New day detected, returning zeros');
    return {
      quizzesTaken: 0,
      vocabularyStudied: 0,
      phrasesStudied: 0,
      aiChatsUsed: 0,
      aiTranslationsUsed: 0
    };
  }

  const result = {
    quizzesTaken: this.progress.dailyActivity.quizzesTaken || 0,
    vocabularyStudied: this.progress.dailyActivity.vocabularyStudied || 0,
    phrasesStudied: this.progress.dailyActivity.phrasesStudied || 0,
    aiChatsUsed: this.progress.dailyActivity.aiChatsUsed || 0,
    aiTranslationsUsed: this.progress.dailyActivity.aiTranslationsUsed || 0
  };
  
  console.log('📊 Returning same day activity:', result);
  return result;
};

module.exports = mongoose.model('User', userSchema);

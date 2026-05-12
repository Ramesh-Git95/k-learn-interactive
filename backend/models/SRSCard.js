const mongoose = require('mongoose');

const srsCardSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Card content
  front: {
    type: String,
    required: [true, 'Front content is required'],
    trim: true
  },
  back: {
    type: String,
    required: [true, 'Back content is required'],
    trim: true
  },
  pronunciation: {
    type: String,
    trim: true
  },
  example: {
    type: String,
    trim: true
  },
  
  // Card metadata
  type: {
    type: String,
    enum: ['vocabulary', 'grammar', 'phrase', 'hangul'],
    required: true
  },
  category: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // SRS algorithm data
  srs: {
    // Current interval (in days)
    interval: {
      type: Number,
      default: 1
    },
    // Number of times reviewed
    repetitions: {
      type: Number,
      default: 0
    },
    // Easiness factor (2.5 is default in SM-2 algorithm)
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3
    },
    // Next review date
    nextReview: {
      type: Date,
      default: Date.now
    },
    // Current SRS stage/level
    stage: {
      type: Number,
      default: 0,
      min: 0
    },
    // Times this card was reviewed incorrectly
    lapses: {
      type: Number,
      default: 0
    }
  },
  
  // Statistics
  stats: {
    totalReviews: {
      type: Number,
      default: 0
    },
    correctReviews: {
      type: Number,
      default: 0
    },
    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    lastReviewed: Date,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  },
  
  // Card status
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
srsCardSchema.index({ userId: 1, 'srs.nextReview': 1 });
srsCardSchema.index({ userId: 1, type: 1 });
srsCardSchema.index({ userId: 1, category: 1 });
srsCardSchema.index({ userId: 1, isActive: 1, isSuspended: 1 });

// Instance method to calculate next review using SM-2 algorithm
srsCardSchema.methods.calculateNextReview = function(quality) {
  // Quality: 0-5 scale (0: complete blackout, 5: perfect response)
  
  // Update repetitions
  if (quality >= 3) {
    this.srs.repetitions += 1;
  } else {
    this.srs.repetitions = 0;
    this.srs.lapses += 1;
  }
  
  // Update ease factor
  this.srs.easeFactor = Math.max(
    1.3,
    this.srs.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  // Calculate new interval
  if (this.srs.repetitions === 0) {
    this.srs.interval = 1;
  } else if (this.srs.repetitions === 1) {
    this.srs.interval = 6;
  } else {
    this.srs.interval = Math.round(this.srs.interval * this.srs.easeFactor);
  }
  
  // Set next review date
  this.srs.nextReview = new Date(Date.now() + this.srs.interval * 24 * 60 * 60 * 1000);
  
  // Update stage based on repetitions
  this.srs.stage = Math.min(this.srs.repetitions, 10);
  
  return this;
};

// Instance method to record review result
srsCardSchema.methods.recordReview = function(quality, responseTime = 0) {
  // Update SRS data
  this.calculateNextReview(quality);
  
  // Update statistics
  this.stats.totalReviews += 1;
  if (quality >= 3) {
    this.stats.correctReviews += 1;
  }
  this.stats.accuracy = (this.stats.correctReviews / this.stats.totalReviews) * 100;
  this.stats.averageResponseTime = (
    (this.stats.averageResponseTime * (this.stats.totalReviews - 1) + responseTime) /
    this.stats.totalReviews
  );
  this.stats.lastReviewed = new Date();
  
  return this.save();
};

// Static method to get cards due for review
srsCardSchema.statics.getDueCards = function(userId, limit = 20) {
  return this.find({
    userId,
    isActive: true,
    isSuspended: false,
    'srs.nextReview': { $lte: new Date() }
  })
  .sort({ 'srs.nextReview': 1 })
  .limit(limit);
};

// Static method to get user's card statistics
srsCardSchema.statics.getUserStats = async function(userId) {
  const pipeline = [
    { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalCards: { $sum: 1 },
        dueCards: {
          $sum: {
            $cond: [
              { $lte: ['$srs.nextReview', new Date()] },
              1,
              0
            ]
          }
        },
        newCards: {
          $sum: {
            $cond: [
              { $eq: ['$srs.repetitions', 0] },
              1,
              0
            ]
          }
        },
        avgAccuracy: { $avg: '$stats.accuracy' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalCards: 0,
    dueCards: 0,
    newCards: 0,
    avgAccuracy: 0
  };
};

module.exports = mongoose.model('SRSCard', srsCardSchema);

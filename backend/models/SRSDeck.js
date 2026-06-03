const mongoose = require('mongoose');

const SRSDataSchema = new mongoose.Schema({
  interval: { type: Number, default: 1 },
  easeFactor: { type: Number, default: 2.5 },
  repetitions: { type: Number, default: 0 },
  nextReviewDate: { type: Date, default: Date.now },
  lastReviewDate: { type: Date, default: null },
  quality: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  correctStreak: { type: Number, default: 0 }
});

const PerformanceSchema = new mongoose.Schema({
  totalReviews: { type: Number, default: 0 },
  correctReviews: { type: Number, default: 0 },
  averageTime: { type: Number, default: 0 },
  lastReviewTime: { type: Number, default: 0 },
  averageResponseTime: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  difficultyRating: { type: Number, default: 3 }
});

const CardContentSchema = new mongoose.Schema({
  korean: { type: String, required: true },
  english: { type: String, required: true },
  romanization: { type: String },
  type: { 
    type: String, 
    enum: ['vocabulary', 'phrase', 'grammar', 'character'], 
    required: true 
  },
  category: { type: String }
});

const SRSCardSchema = new mongoose.Schema({
  id: { type: String, required: true },
  content: CardContentSchema,
  srs: SRSDataSchema,
  performance: PerformanceSchema,
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now }
});

const DeckStatsSchema = new mongoose.Schema({
  totalCards: { type: Number, default: 0 },
  newCards: { type: Number, default: 0 },
  learningCards: { type: Number, default: 0 },
  reviewCards: { type: Number, default: 0 },
  matureCards: { type: Number, default: 0 },
  dailyReviews: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 }
});

const DeckSettingsSchema = new mongoose.Schema({
  newCardsPerDay: { type: Number, default: 10 },
  maxReviewsPerDay: { type: Number, default: 50 },
  graduationInterval: { type: Number, default: 4 },
  easyInterval: { type: Number, default: 7 },
  hardInterval: { type: Number, default: 0.85 },
  lapseInterval: { type: Number, default: 1 }
});

const SRSDeckSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  cards: [SRSCardSchema],
  settings: DeckSettingsSchema,
  stats: DeckStatsSchema,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now }
});

// Add indexes for performance
SRSDeckSchema.index({ userId: 1 });
SRSDeckSchema.index({ 'cards.srs.nextReviewDate': 1 });

module.exports = mongoose.model('SRSDeck', SRSDeckSchema);

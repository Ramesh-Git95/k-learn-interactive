const mongoose = require('mongoose');

// One guided "Today's Session" per user per (user-local) day.
// Each step carries its own baseline (the relevant progress counter at
// composition time) and goal; the client auto-detects completion by comparing
// live numbers against them. Storing everything here means a crash/refresh/
// device switch never loses session progress. Step composition is
// stage-aware: brand-new learners get a gentle Hangul/culture/phrases plan,
// established learners get review/learn/quiz.
const SessionStepSchema = new mongoose.Schema({
  id:       { type: String, required: true },   // 'srs' | 'learn' | 'quiz'
  label:    { type: String, required: true },
  target:   { type: String, default: '' },      // section id or SRS deck id
  baseline: { type: Number, default: 0 },       // metric snapshot at composition
  goal:     { type: Number, default: 1 },       // delta required to complete
  done:     { type: Boolean, default: false },
  doneAt:   { type: Date, default: null },
}, { _id: false });

const DailySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:   { type: String, required: true },     // user-local 'YYYY-MM-DD'
  steps:  { type: [SessionStepSchema], default: [] },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

DailySessionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailySession', DailySessionSchema);

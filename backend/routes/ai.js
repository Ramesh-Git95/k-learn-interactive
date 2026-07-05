const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { authenticateToken, rateLimit } = require('../middleware/auth');

const router = express.Router();

const getAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured on the server.');
  return new GoogleGenAI({ apiKey: key });
};

// ── Server-side daily quotas (source of truth — the client display mirrors these).
// Keep the chat numbers in sync with FEATURE_LIMITS.aiConversationsPerDay in
// hooks/useFeatureAccess.tsx. Translate caps are invisible abuse/cost guards.
const CHAT_LIMITS = { free: 5, premium: 50 };
const TRANSLATE_LIMITS = { free: 20, premium: 100 };

const chatLimitFor = (user) => (user.hasPremiumAccess() ? CHAT_LIMITS.premium : CHAT_LIMITS.free);
const translateLimitFor = (user) => (user.hasPremiumAccess() ? TRANSLATE_LIMITS.premium : TRANSLATE_LIMITS.free);

const TOPIC_PROMPTS = {
  general:    '일반적인 일상 대화',
  restaurant: '레스토랑에서의 대화 (주문, 결제, 추천 등)',
  shopping:   '쇼핑 상황에서의 대화 (가격, 크기, 색상 등)',
  travel:     '여행 관련 대화 (길찾기, 관광지, 교통 등)',
  work:       '직장에서의 대화 (업무, 회의, 동료와의 대화)',
  hobby:      '취미 활동에 대한 대화 (영화, 음악, 스포츠 등)',
};

const DIFFICULTY_INSTRUCTIONS = {
  beginner:     '매우 간단한 문장과 기본 어휘를 사용하여 답변하세요. 존댓말을 사용하고 짧게 답변하세요.',
  intermediate: '적당한 수준의 문장과 어휘를 사용하여 답변하세요. 다양한 표현을 섞어서 사용하세요.',
  advanced:     '자연스럽고 복잡한 문장 구조와 고급 어휘를 사용하여 답변하세요. 관용표현도 포함하세요.',
};

// ── Conversation history guards (cost control) ──────────────────────────────
const MAX_HISTORY_MESSAGES = 8;   // most recent turns sent as context
const MAX_HISTORY_CHARS = 600;    // per history message

// Validate and normalise client-supplied history into Gemini content turns.
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(m => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .map(m => ({
      role: m.role,
      parts: [{ text: m.text.trim().slice(0, MAX_HISTORY_CHARS) }],
    }));
}

// @route  GET /api/ai/quota
// @desc   Current daily AI usage + limits for the logged-in user
// @access Private
router.get('/quota', authenticateToken, async (req, res) => {
  const activity = req.user.getDailyActivity();
  res.json({
    chat: { used: activity.aiChatsUsed || 0, limit: chatLimitFor(req.user) },
    translate: { used: activity.aiTranslationsUsed || 0, limit: translateLimitFor(req.user) },
  });
});

// @route  POST /api/ai/chat
// @desc   Korean conversation with memory (recent turns) via Gemini
// @access Private · server-enforced daily quota + burst rate limit
router.post('/chat', authenticateToken, rateLimit(60 * 1000, 8), async (req, res) => {
  try {
    const { message, topic = 'general', difficulty = 'beginner', history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required', error: 'MISSING_MESSAGE' });
    }
    if (message.length > 500) {
      return res.status(400).json({ message: 'Message too long (max 500 chars)', error: 'MESSAGE_TOO_LONG' });
    }

    // Server-side daily quota — the client check is only cosmetic.
    const user = req.user;
    const limit = chatLimitFor(user);
    const used = user.getDailyActivity().aiChatsUsed || 0;
    if (used >= limit) {
      return res.status(429).json({
        message: `Daily AI chat limit reached (${limit}/day).`,
        error: 'DAILY_LIMIT_REACHED',
        used,
        limit,
      });
    }

    const ai = getAI();
    const systemInstruction = `당신은 한국어를 가르치는 친근한 AI 선생님입니다.

상황: ${TOPIC_PROMPTS[topic] ?? TOPIC_PROMPTS.general}
난이도: ${difficulty} (${DIFFICULTY_INSTRUCTIONS[difficulty] ?? DIFFICULTY_INSTRUCTIONS.beginner})

다음 규칙을 따라 답변해주세요:
1. 오직 한국어로만 답변하세요
2. 자연스럽고 대화적인 톤을 사용하세요
3. 필요시 사용자의 한국어를 자연스럽게 교정해주세요
4. 대화를 이어나갈 수 있는 질문이나 코멘트를 포함하세요
5. 답변은 2-3문장 정도로 적당한 길이로 해주세요
6. 이전 대화 내용을 기억하고 자연스럽게 이어가세요`;

    const contents = [
      ...sanitizeHistory(history),
      { role: 'user', parts: [{ text: message.trim() }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      // thinkingBudget 0 disables reasoning tokens so the output budget goes to the reply
      config: {
        systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 300,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const reply = (response.text || '').trim();
    if (!reply) {
      console.error('AI chat: empty response, finishReason:', response.candidates?.[0]?.finishReason);
      return res.status(502).json({ message: 'The AI could not reply right now. Please try again.', error: 'EMPTY_REPLY' });
    }

    // Count usage only after a successful reply (fair to the user).
    user.trackDailyActivity('aiChat', 1);
    await user.save();

    res.json({ reply, used: used + 1, limit });

  } catch (error) {
    console.error('AI chat error:', error?.message, error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ message: 'AI service is not configured', error: 'AI_NOT_CONFIGURED' });
    }
    res.status(500).json({ message: 'AI service error', error: 'AI_ERROR' });
  }
});

// @route  POST /api/ai/translate
// @desc   Proxy translation request to Gemini
// @access Private · server-enforced daily quota
router.post('/translate', authenticateToken, rateLimit(60 * 1000, 15), async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ message: 'Text is required', error: 'MISSING_TEXT' });
    }
    if (text.length > 500) {
      return res.status(400).json({ message: 'Text too long (max 500 chars)', error: 'TEXT_TOO_LONG' });
    }

    const user = req.user;
    const limit = translateLimitFor(user);
    const used = user.getDailyActivity().aiTranslationsUsed || 0;
    if (used >= limit) {
      return res.status(429).json({
        message: `Daily translation limit reached (${limit}/day).`,
        error: 'DAILY_LIMIT_REACHED',
        used,
        limit,
      });
    }

    const ai = getAI();
    const prompt = `다음 텍스트를 자연스럽고 정확하게 번역해주세요. 한국어면 영어로, 영어면 한국어로 번역하세요. 번역된 텍스트만 반환하고 다른 설명은 포함하지 마세요.

텍스트: "${text.trim()}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.3, maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 0 } },
    });

    const translation = (response.text || '').trim();
    if (!translation) {
      console.error('AI translate: empty response, finishReason:', response.candidates?.[0]?.finishReason);
      return res.status(502).json({ message: 'Could not translate right now. Please try again.', error: 'EMPTY_TRANSLATION' });
    }

    user.trackDailyActivity('aiTranslate', 1);
    await user.save();

    res.json({ translation });

  } catch (error) {
    console.error('AI translate error:', error?.message, error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ message: 'AI service is not configured', error: 'AI_NOT_CONFIGURED' });
    }
    res.status(500).json({ message: 'AI service error', error: 'AI_ERROR' });
  }
});

module.exports = router;

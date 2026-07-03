const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const getAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured on the server.');
  return new GoogleGenAI({ apiKey: key });
};

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

// @route  POST /api/ai/chat
// @desc   Proxy Korean conversation request to Gemini
// @access Private (must be logged in)
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, topic = 'general', difficulty = 'beginner' } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required', error: 'MISSING_MESSAGE' });
    }
    if (message.length > 500) {
      return res.status(400).json({ message: 'Message too long (max 500 chars)', error: 'MESSAGE_TOO_LONG' });
    }

    const ai = getAI();
    const prompt = `당신은 한국어를 가르치는 친근한 AI 선생님입니다.

상황: ${TOPIC_PROMPTS[topic] ?? TOPIC_PROMPTS.general}
난이도: ${difficulty} (${DIFFICULTY_INSTRUCTIONS[difficulty] ?? DIFFICULTY_INSTRUCTIONS.beginner})

사용자 메시지: "${message.trim()}"

다음 규칙을 따라 답변해주세요:
1. 오직 한국어로만 답변하세요
2. 자연스럽고 대화적인 톤을 사용하세요
3. 필요시 사용자의 한국어를 자연스럽게 교정해주세요
4. 대화를 이어나갈 수 있는 질문이나 코멘트를 포함하세요
5. 답변은 2-3문장 정도로 적당한 길이로 해주세요`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      // thinkingBudget 0 disables reasoning tokens so the output budget goes to the reply
      config: { temperature: 0.8, maxOutputTokens: 300, thinkingConfig: { thinkingBudget: 0 } },
    });

    res.json({ reply: response.text });

  } catch (error) {
    console.error('AI chat error:', error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ message: 'AI service is not configured', error: 'AI_NOT_CONFIGURED' });
    }
    res.status(500).json({ message: 'AI service error', error: 'AI_ERROR' });
  }
});

// @route  POST /api/ai/translate
// @desc   Proxy translation request to Gemini
// @access Private
router.post('/translate', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ message: 'Text is required', error: 'MISSING_TEXT' });
    }
    if (text.length > 500) {
      return res.status(400).json({ message: 'Text too long (max 500 chars)', error: 'TEXT_TOO_LONG' });
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/** Error carrying the backend error code (e.g. DAILY_LIMIT_REACHED). */
export class AiError extends Error {
  code: string;
  used?: number;
  limit?: number;
  constructor(message: string, code: string, used?: number, limit?: number) {
    super(message);
    this.code = code;
    this.used = used;
    this.limit = limit;
  }
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface ChatResponse {
  reply: string;
  used: number;
  limit: number;
}

export const getConversationResponse = async (
  userMessage: string,
  topic: string,
  difficulty: string,
  history: ChatHistoryItem[] = []
): Promise<ChatResponse> => {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message: userMessage, topic, difficulty, history }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AiError(data.message || 'AI service error', data.error || 'AI_ERROR', data.used, data.limit);
  }
  return { reply: data.reply, used: data.used, limit: data.limit };
};

export const translateText = async (text: string): Promise<string> => {
  const res = await fetch(`${API_BASE_URL}/ai/translate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ text }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AiError(data.message || 'Translation error', data.error || 'AI_ERROR');
  }
  return data.translation;
};

/** Server-side daily AI usage — the authoritative counts. */
export const getChatQuota = async (): Promise<{ used: number; limit: number } | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/quota`, { headers: authHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return { used: data.chat.used, limit: data.chat.limit };
  } catch {
    return null;
  }
};

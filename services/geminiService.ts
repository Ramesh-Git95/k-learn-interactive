const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const getConversationResponse = async (
  userMessage: string,
  topic: string,
  difficulty: string
): Promise<string> => {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message: userMessage, topic, difficulty }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'AI service error');
  }

  const data = await res.json();
  return data.reply;
};

export const translateText = async (text: string): Promise<string> => {
  const res = await fetch(`${API_BASE_URL}/ai/translate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Translation error');
  }

  const data = await res.json();
  return data.translation;
};

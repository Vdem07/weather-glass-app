/**
 * openrouter.js
 *
 * Работа с OpenRouter API: отправка сообщений языковой модели и получение ответа.
 */

const OPENROUTER_URL = process.env.EXPO_PUBLIC_OPENROUTER_URL;
const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY;
const MODEL = 'openrouter/auto';

export const askAI = async (systemPrompt, messages) => {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return data.choices?.[0]?.message?.content || 'Не удалось получить ответ.';
};

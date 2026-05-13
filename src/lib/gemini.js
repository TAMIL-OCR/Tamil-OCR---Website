const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Models to try in order — each has separate rate limits
const MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(model, body) {
  const url = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    const isRateLimit = res.status === 429;
    throw { message: err, isRateLimit, status: res.status };
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

export async function askGemini(prompt, systemInstruction = '') {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  // Try each model, fall back on rate limit
  for (let i = 0; i < MODELS.length; i++) {
    try {
      return await callGemini(MODELS[i], body);
    } catch (err) {
      if (err.isRateLimit && i < MODELS.length - 1) {
        console.log(`Rate limited on ${MODELS[i]}, trying ${MODELS[i + 1]} after 2s...`);
        await delay(2000);
        continue;
      }
      throw new Error(`Gemini API error: ${err.message}`);
    }
  }
}

export async function askGeminiWithFile(prompt, fileBase64, mimeType, systemInstruction = '') {
  const parts = [
    { inlineData: { mimeType, data: fileBase64 } },
    { text: prompt },
  ];
  const body = { contents: [{ parts }] };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  for (let i = 0; i < MODELS.length; i++) {
    try {
      return await callGemini(MODELS[i], body);
    } catch (err) {
      if (err.isRateLimit && i < MODELS.length - 1) {
        console.log(`Rate limited on ${MODELS[i]}, trying ${MODELS[i + 1]} after 2s...`);
        await delay(2000);
        continue;
      }
      throw new Error(`Gemini API error: ${err.message}`);
    }
  }
}

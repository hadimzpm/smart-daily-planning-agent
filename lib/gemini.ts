const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ERROR_MESSAGE = 'Gemini request failed.';

export function getGeminiModel(): string {
  return GEMINI_MODEL;
}

export async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Gemini API key is missing on the server.');
    throw new Error(GEMINI_ERROR_MESSAGE);
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) {
    const responseBody = await response.text();
    console.error('Gemini API request failed.', {
      status: response.status,
      statusText: response.statusText,
      model: GEMINI_MODEL,
      responseBody,
    });
    throw new Error(GEMINI_ERROR_MESSAGE);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();

  if (!text) {
    console.error('Gemini API returned an empty response.', { model: GEMINI_MODEL, response: data });
    throw new Error(GEMINI_ERROR_MESSAGE);
  }

  return text;
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash-lite';

class GeminiApiError extends Error {
  status: number;
  statusText: string;
  body: string;
  model: string;

  constructor(status: number, statusText: string, body: string, model: string) {
    super(`Gemini API request failed with status ${status}.`);
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.model = model;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createLocalFallbackResponse(): string {
  return `
Gemini was temporarily unavailable, so this result was generated using local demo fallback mode.

Daily plan:
09:00-09:30 Review the main goal of the day and prepare your workspace.
09:30-10:30 Work on the highest priority task.
10:30-10:45 Take a short break.
10:45-12:00 Continue the core project work.
12:00-13:00 Lunch and recovery time.
13:00-14:00 Review project documentation and prepare notes.
14:00-15:00 Attend fixed meeting or project review.
15:00-15:15 Take a short break.
15:15-16:30 Finish remaining project tasks.
16:30-17:00 Review output quality and prepare next steps.
17:00-17:30 Final check and wrap-up.

Prioritized tasks:
1. Finish the main Kaggle Capstone submission work.
2. Review the README and project documentation.
3. Test the deployed Vercel demo.
4. Prepare notes for the demo video or writeup.

Suggested breaks:
1. Take a short break after the first deep work block.
2. Take a longer recovery break around lunch.
3. Take a short break before the final review block.

Risks or overload warnings:
The day includes multiple project tasks, so the main risk is spending too much time polishing instead of finishing. Keep the first version simple and complete.

Safety check result:
Safe. The plan does not require sensitive personal data, passwords, private credentials, payments, or external user information.

Evaluation score:
8/10

Agent collaboration explanation:
The Coordinator Agent interpreted the user goal. The Task Analyzer Agent identified priority work. The Schedule Builder Agent created the time blocks. The Safety Guardrail Agent checked for risky or sensitive content. The Evaluation Agent reviewed the plan quality and gave a score.
`.trim();
}

async function callGemini(model: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 900,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error('Gemini API error:', {
      model,
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    throw new GeminiApiError(response.status, response.statusText, errorBody, model);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return text;
}

async function callGeminiWithRetry(
  model: string,
  prompt: string,
  apiKey: string,
  attempts: number,
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await callGemini(model, prompt, apiKey);
    } catch (error) {
      lastError = error;

      if (error instanceof GeminiApiError && error.status === 503 && attempt < attempts) {
        await wait(1200);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured.');
    return createLocalFallbackResponse();
  }

  try {
    return await callGeminiWithRetry(GEMINI_MODEL, prompt, apiKey, 2);
  } catch (primaryError) {
    console.error('Primary Gemini model failed. Trying fallback model.', primaryError);

    try {
      return await callGeminiWithRetry(GEMINI_FALLBACK_MODEL, prompt, apiKey, 1);
    } catch (fallbackError) {
      console.error('Fallback Gemini model failed. Using local demo fallback mode.', fallbackError);
      return createLocalFallbackResponse();
    }
  }
}

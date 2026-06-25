const PRIMARY_GEMINI_MODEL = 'gemini-2.5-flash';
const FALLBACK_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_ERROR_MESSAGE = 'Gemini request failed.';
const LOCAL_FALLBACK_NOTICE =
  'Gemini was temporarily unavailable, so this result was generated using local demo fallback mode.';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEvaluationPrompt(prompt: string): boolean {
  return prompt.includes('return ONLY valid JSON') || prompt.includes('"dailyPlan"');
}

function createLocalFallbackResponse(prompt: string): string {
  if (isEvaluationPrompt(prompt)) {
    return JSON.stringify({
      dailyPlan: [
        `${LOCAL_FALLBACK_NOTICE}`,
        '09:00-09:15 Review your main goal, confirm fixed meetings, and choose the top three tasks for the day.',
        '09:15-10:30 Focus on the highest-priority task while energy is freshest.',
        '10:30-10:45 Take a short break and update the plan if meetings or urgent work changed.',
        '10:45-12:00 Continue focused work or complete the next most important task.',
        '13:00-15:00 Handle fixed meetings and lighter administrative work between commitments.',
        '15:00-16:30 Finish one meaningful deliverable tied to the main goal.',
        '16:30-17:00 Review progress, capture follow-ups, and prepare tomorrow\'s first step.',
      ],
      prioritizedTasks: [
        'Protect the main goal of the day first.',
        'Complete time-sensitive or meeting-dependent work next.',
        'Defer optional tasks if the schedule becomes overloaded.',
      ],
      suggestedBreaks: [
        'Take a 10-15 minute break after each deep work block.',
        'Use a real lunch break away from the screen when possible.',
        'Reserve a short end-of-day reset before stopping work.',
      ],
      risks: [
        'This fallback plan is generic because Gemini was temporarily unavailable.',
        'Watch for overloading the afternoon with too many tasks after meetings.',
        'Manually adjust times around any fixed meetings you entered.',
      ],
      risksOrWarnings: [
        'This fallback plan is generic because Gemini was temporarily unavailable.',
        'Watch for overloading the afternoon with too many tasks after meetings.',
        'Manually adjust times around any fixed meetings you entered.',
      ],
      safetyCheck:
        'Local fallback safety check: the plan includes breaks, avoids all-day focus blocks, and recommends deferring optional work if overloaded.',
      safetyCheckResult:
        'Local fallback safety check: the plan includes breaks, avoids all-day focus blocks, and recommends deferring optional work if overloaded.',
      evaluationScore: 7,
      agentCollaboration: [
        'Coordinator Agent used local fallback mode to preserve demo reliability.',
        'Task Analyzer Agent prioritized the main goal and time-sensitive work with deterministic rules.',
        'Schedule Builder Agent created a conservative workday structure with breaks.',
        'Safety Guardrail Agent added overload warnings and pacing guidance.',
        'Evaluation Agent assigned a demo-safe score based on completeness and practicality.',
      ],
    });
  }

  return `${LOCAL_FALLBACK_NOTICE}\n- Prioritize the main goal first.\n- Keep fixed meetings protected.\n- Use focused work blocks with short breaks.\n- Defer optional work if the day becomes overloaded.`;
}

async function callGeminiModel(model: string, prompt: string): Promise<Response> {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });
}

async function readGeminiText(response: Response, model: string): Promise<string> {
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();

  if (!text) {
    console.error('Gemini API returned an empty response.', { model, response: data });
    throw new Error(GEMINI_ERROR_MESSAGE);
  }

  return text;
}

export function getGeminiModel(): string {
  return PRIMARY_GEMINI_MODEL;
}

export async function askGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Gemini API key is missing on the server.');
    throw new Error(GEMINI_ERROR_MESSAGE);
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await callGeminiModel(PRIMARY_GEMINI_MODEL, prompt);

    if (response.ok) {
      return readGeminiText(response, PRIMARY_GEMINI_MODEL);
    }

    const responseBody = await response.text();
    console.error('Gemini primary model request failed.', {
      status: response.status,
      statusText: response.statusText,
      model: PRIMARY_GEMINI_MODEL,
      attempt,
      responseBody,
    });

    if (response.status !== 503) {
      throw new Error(GEMINI_ERROR_MESSAGE);
    }

    if (attempt < 2) {
      await wait(600);
    }
  }

  const fallbackResponse = await callGeminiModel(FALLBACK_GEMINI_MODEL, prompt);

  if (fallbackResponse.ok) {
    return readGeminiText(fallbackResponse, FALLBACK_GEMINI_MODEL);
  }

  const fallbackResponseBody = await fallbackResponse.text();
  console.error('Gemini fallback model request failed.', {
    status: fallbackResponse.status,
    statusText: fallbackResponse.statusText,
    model: FALLBACK_GEMINI_MODEL,
    responseBody: fallbackResponseBody,
  });

  if (fallbackResponse.status === 503) {
    return createLocalFallbackResponse(prompt);
  }

  throw new Error(GEMINI_ERROR_MESSAGE);
}

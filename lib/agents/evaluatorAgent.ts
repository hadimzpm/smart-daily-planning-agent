import { askGemini } from '@/lib/gemini';
import type { AgentContext, DailyPlan } from './types';

const NON_JSON_FALLBACK_NOTE =
  'Gemini returned a non-JSON formatted response, so this structured result was generated using local demo fallback mode.';

function cleanGeminiJsonOutput(text: string): string {
  return text.replace(/```json/gi, '').replace(/```/g, '').trim();
}

function getStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const strings = value.map((item) => String(item).trim()).filter(Boolean);
  return strings.length > 0 ? strings : fallback;
}

function getEvaluationScore(value: unknown): number {
  return Math.max(1, Math.min(10, Number(value) || 1));
}

function createNonJsonFallbackPlan(): DailyPlan {
  return {
    dailyPlan: [
      NON_JSON_FALLBACK_NOTE,
      'Review your main goal and identify the single most important outcome for today.',
      'Protect fixed meetings and schedule focused work around them.',
      'Use short planning checkpoints to adjust scope if the day becomes overloaded.',
    ],
    prioritizedTasks: [
      'Work on the main goal first.',
      'Complete time-sensitive tasks second.',
      'Defer optional or low-impact tasks if needed.',
    ],
    suggestedBreaks: [
      'Take a 10-15 minute break after each long focus block.',
      'Reserve time for lunch or a true midpoint reset.',
      'End with a short review and shutdown routine.',
    ],
    risks: [
      'The original Gemini response was not parseable as JSON.',
      'This local fallback is generic and should be adjusted to your exact meetings and tasks.',
      'Avoid packing every open task into one day if energy is low.',
    ],
    risksOrWarnings: [
      'The original Gemini response was not parseable as JSON.',
      'This local fallback is generic and should be adjusted to your exact meetings and tasks.',
      'Avoid packing every open task into one day if energy is low.',
    ],
    safetyCheck: 'Local fallback safety check: includes breaks, scope control, and overload warnings.',
    safetyCheckResult: 'Local fallback safety check: includes breaks, scope control, and overload warnings.',
    evaluationScore: 6,
    agentCollaboration: [
      'Evaluation Agent detected non-JSON Gemini output and switched to local structured fallback mode.',
      'Coordinator Agent fallback preserved the required demo sections.',
      'Safety Guardrail fallback added break and overload guidance.',
    ],
  };
}

function parseDailyPlan(response: string): DailyPlan {
  try {
    const parsed = JSON.parse(cleanGeminiJsonOutput(response)) as Partial<DailyPlan>;
    const risks = getStringArray(parsed.risks ?? parsed.risksOrWarnings, []);
    const safetyCheck = String(parsed.safetyCheck ?? parsed.safetyCheckResult ?? 'Safety review completed.');

    return {
      dailyPlan: getStringArray(parsed.dailyPlan, []),
      prioritizedTasks: getStringArray(parsed.prioritizedTasks, []),
      suggestedBreaks: getStringArray(parsed.suggestedBreaks, []),
      risks,
      risksOrWarnings: risks,
      safetyCheck,
      safetyCheckResult: safetyCheck,
      evaluationScore: getEvaluationScore(parsed.evaluationScore),
      agentCollaboration: getStringArray(parsed.agentCollaboration, []),
    };
  } catch (error) {
    console.error('Failed to parse Gemini evaluation JSON.', {
      error,
      cleanedResponse: cleanGeminiJsonOutput(response),
    });
    return createNonJsonFallbackPlan();
  }
}

export async function runEvaluationAgent(context: AgentContext): Promise<DailyPlan> {
  const response = await askGemini(`You are the Evaluation Agent.
Evaluate the daily plan and return ONLY valid JSON matching this TypeScript type:
{
  "dailyPlan": string[],
  "prioritizedTasks": string[],
  "suggestedBreaks": string[],
  "risks": string[],
  "safetyCheck": string,
  "evaluationScore": number,
  "agentCollaboration": string[]
}
The evaluationScore must be an integer from 1 to 10.

Coordinator output:
${context.coordination}

Task Analyzer output:
${context.taskAnalysis}

Schedule Builder output:
${context.schedule}

Safety Guardrail output:
${context.safety}

User main goal: ${context.input.mainGoal}`);

  return parseDailyPlan(response);
}

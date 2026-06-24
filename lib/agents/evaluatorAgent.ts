import { askGemini } from '@/lib/gemini';
import type { AgentContext, DailyPlan } from './types';

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

export async function runEvaluationAgent(context: AgentContext): Promise<DailyPlan> {
  const response = await askGemini(`You are the Evaluation Agent.
Evaluate the daily plan and return ONLY valid JSON matching this TypeScript type:
{
  "dailyPlan": string[],
  "prioritizedTasks": string[],
  "suggestedBreaks": string[],
  "risksOrWarnings": string[],
  "safetyCheckResult": string,
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

  const parsed = JSON.parse(extractJson(response)) as DailyPlan;

  return {
    dailyPlan: Array.isArray(parsed.dailyPlan) ? parsed.dailyPlan : [],
    prioritizedTasks: Array.isArray(parsed.prioritizedTasks) ? parsed.prioritizedTasks : [],
    suggestedBreaks: Array.isArray(parsed.suggestedBreaks) ? parsed.suggestedBreaks : [],
    risksOrWarnings: Array.isArray(parsed.risksOrWarnings) ? parsed.risksOrWarnings : [],
    safetyCheckResult: String(parsed.safetyCheckResult ?? 'Safety review completed.'),
    evaluationScore: Math.max(1, Math.min(10, Number(parsed.evaluationScore) || 1)),
    agentCollaboration: Array.isArray(parsed.agentCollaboration) ? parsed.agentCollaboration : [],
  };
}

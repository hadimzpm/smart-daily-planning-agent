import { askGemini } from '@/lib/gemini';
import type { AgentContext } from './types';

export async function runScheduleBuilderAgent(context: AgentContext): Promise<string> {
  return askGemini(`You are the Schedule Builder Agent.
Build a realistic daily schedule within the user's working hours, respecting fixed meetings and energy level.
Include focused work blocks, admin blocks, and breaks.

Coordinator guidance:
${context.coordination}

Task analysis:
${context.taskAnalysis}

User input:
Working hours: ${context.input.workingHours}
Fixed meetings: ${context.input.meetings}`);
}

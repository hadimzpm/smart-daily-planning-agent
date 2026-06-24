import { askGemini } from '@/lib/gemini';
import type { AgentContext } from './types';

export async function runTaskAnalyzerAgent(context: AgentContext): Promise<string> {
  return askGemini(`You are the Task Analyzer Agent.
Analyze the user's task list, infer priorities from the main goal, identify dependencies, and flag likely overload.
Keep the output concise and practical.

Coordinator guidance:
${context.coordination}

User input:
Daily tasks: ${context.input.tasks}
Fixed meetings: ${context.input.meetings}
Working hours: ${context.input.workingHours}
Energy level: ${context.input.energyLevel}
Main goal: ${context.input.mainGoal}`);
}

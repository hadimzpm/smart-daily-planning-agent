import { askGemini } from '@/lib/gemini';
import type { AgentContext } from './types';

export async function runCoordinatorAgent(context: AgentContext): Promise<string> {
  return askGemini(`You are the Coordinator Agent for a simple daily planning concierge.
Create a concise workflow plan for the specialist agents. Do not invent tasks.

User input:
Daily tasks: ${context.input.tasks}
Fixed meetings: ${context.input.meetings}
Working hours: ${context.input.workingHours}
Energy level: ${context.input.energyLevel}
Main goal: ${context.input.mainGoal}

Return 3-5 bullet points describing how the agents should collaborate.`);
}

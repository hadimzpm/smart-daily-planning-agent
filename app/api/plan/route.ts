import { NextResponse } from 'next/server';
import { runCoordinatorAgent } from '@/lib/agents/coordinatorAgent';
import { runEvaluationAgent } from '@/lib/agents/evaluatorAgent';
import { runSafetyGuardrailAgent } from '@/lib/agents/safetyAgent';
import { runScheduleBuilderAgent } from '@/lib/agents/scheduleBuilderAgent';
import { runTaskAnalyzerAgent } from '@/lib/agents/taskAnalyzerAgent';
import type { AgentContext, PlanInput } from '@/lib/agents/types';

const GENERIC_PLAN_ERROR = 'Unable to generate a daily plan right now. Please try again later.';

function isValidInput(input: Partial<PlanInput>): input is PlanInput {
  return Boolean(
    input.tasks?.trim() &&
      input.meetings?.trim() &&
      input.workingHours?.trim() &&
      input.energyLevel?.trim() &&
      input.mainGoal?.trim(),
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PlanInput>;

    if (!isValidInput(body)) {
      return NextResponse.json({ error: 'Please complete all daily planning fields.' }, { status: 400 });
    }

    const context: AgentContext = { input: body };
    context.coordination = await runCoordinatorAgent(context);
    context.taskAnalysis = await runTaskAnalyzerAgent(context);
    context.schedule = await runScheduleBuilderAgent(context);
    context.safety = await runSafetyGuardrailAgent(context);
    const plan = await runEvaluationAgent(context);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Daily plan generation failed.', error);
    return NextResponse.json({ error: GENERIC_PLAN_ERROR }, { status: 500 });
  }
}

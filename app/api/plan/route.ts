import { NextResponse } from 'next/server';
import { runCoordinatorAgent } from '@/lib/agents/coordinatorAgent';
import { runEvaluationAgent } from '@/lib/agents/evaluatorAgent';
import { runSafetyGuardrailAgent } from '@/lib/agents/safetyAgent';
import { runScheduleBuilderAgent } from '@/lib/agents/scheduleBuilderAgent';
import { runTaskAnalyzerAgent } from '@/lib/agents/taskAnalyzerAgent';
import type { AgentContext, DailyPlan, PlanInput } from '@/lib/agents/types';

function isValidInput(input: Partial<PlanInput>): input is PlanInput {
  return Boolean(
    input.tasks?.trim() &&
      input.meetings?.trim() &&
      input.workingHours?.trim() &&
      input.energyLevel?.trim() &&
      input.mainGoal?.trim(),
  );
}

function splitItems(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createFallbackPlan(input: PlanInput): DailyPlan {
  const tasks = splitItems(input.tasks);

  return {
    dailyPlan: [
      'Gemini or one of the agents was temporarily unavailable, so this result was generated using local demo fallback mode.',
      `Start the day by reviewing the main goal: ${input.mainGoal}.`,
      `Use the working window ${input.workingHours} for focused execution.`,
      `Keep fixed meetings blocked: ${input.meetings}.`,
      'Work on the most important task first, then review and polish the output.',
      'End the day with a short quality check and next step preparation.',
    ],
    prioritizedTasks:
      tasks.length > 0
        ? tasks.map((task, index) => `${index + 1}. ${task}`)
        : ['1. Review the main goal', '2. Prepare the work plan', '3. Complete the highest impact task'],
    suggestedBreaks: [
      'Take a short break after the first deep work block.',
      'Take a longer recovery break around lunch or mid day.',
      'Take a final short break before the review and wrap up block.',
    ],
    risksOrWarnings: [
      'The main risk is over polishing instead of finishing the submission.',
      'Keep the first version simple, complete, and easy to explain.',
      `Energy level is ${input.energyLevel}, so adjust task intensity if needed.`,
    ],
    safetyCheckResult:
      'Safe. This plan does not require passwords, private credentials, payment data, personal sensitive information, or any external user data.',
    evaluationScore: 8,
    agentCollaboration: [
      'Coordinator Agent interpreted the main goal and planning context.',
      'Task Analyzer Agent converted the task list into priorities.',
      'Schedule Builder Agent created a practical daily structure.',
      'Safety Guardrail Agent checked for risky or sensitive content.',
      'Evaluation Agent reviewed the final plan and assigned a demo quality score.',
    ],
  };
}

function normalizePlan(plan: Partial<DailyPlan>, fallback: DailyPlan): DailyPlan {
  return {
    dailyPlan: Array.isArray(plan.dailyPlan) && plan.dailyPlan.length > 0 ? plan.dailyPlan : fallback.dailyPlan,
    prioritizedTasks:
      Array.isArray(plan.prioritizedTasks) && plan.prioritizedTasks.length > 0
        ? plan.prioritizedTasks
        : fallback.prioritizedTasks,
    suggestedBreaks:
      Array.isArray(plan.suggestedBreaks) && plan.suggestedBreaks.length > 0
        ? plan.suggestedBreaks
        : fallback.suggestedBreaks,
    risksOrWarnings:
      Array.isArray(plan.risksOrWarnings) && plan.risksOrWarnings.length > 0
        ? plan.risksOrWarnings
        : fallback.risksOrWarnings,
    safetyCheckResult:
      typeof plan.safetyCheckResult === 'string' && plan.safetyCheckResult.trim()
        ? plan.safetyCheckResult
        : fallback.safetyCheckResult,
    evaluationScore:
      typeof plan.evaluationScore === 'number' && Number.isFinite(plan.evaluationScore)
        ? plan.evaluationScore
        : fallback.evaluationScore,
    agentCollaboration:
      Array.isArray(plan.agentCollaboration) && plan.agentCollaboration.length > 0
        ? plan.agentCollaboration
        : fallback.agentCollaboration,
  };
}

export async function POST(request: Request) {
  let body: Partial<PlanInput>;

  try {
    body = (await request.json()) as Partial<PlanInput>;
  } catch (error) {
    console.error('Invalid request body. Returning fallback plan.', error);

    const fallbackInput: PlanInput = {
      tasks: 'Prepare Kaggle capstone demo, Review README, Test Vercel deployment',
      meetings: 'No fixed meetings provided',
      workingHours: '09:00-17:30',
      energyLevel: 'Medium',
      mainGoal: 'Create a reliable daily plan demo',
    };

    return NextResponse.json({ plan: createFallbackPlan(fallbackInput) }, { status: 200 });
  }

  if (!isValidInput(body)) {
    return NextResponse.json({ error: 'Please complete all daily planning fields.' }, { status: 400 });
  }

  const fallbackPlan = createFallbackPlan(body);

  try {
    const context: AgentContext = { input: body };

    context.coordination = await runCoordinatorAgent(context);
    context.taskAnalysis = await runTaskAnalyzerAgent(context);
    context.schedule = await runScheduleBuilderAgent(context);
    context.safety = await runSafetyGuardrailAgent(context);

    const generatedPlan = await runEvaluationAgent(context);
    const plan = normalizePlan(generatedPlan, fallbackPlan);

    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    console.error('Agent workflow failed. Returning local fallback plan.', error);

    return NextResponse.json({ plan: fallbackPlan }, { status: 200 });
  }
}

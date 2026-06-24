export type PlanInput = {
  tasks: string;
  meetings: string;
  workingHours: string;
  energyLevel: string;
  mainGoal: string;
};

export type AgentContext = {
  input: PlanInput;
  coordination?: string;
  taskAnalysis?: string;
  schedule?: string;
  safety?: string;
  evaluation?: string;
};

export type DailyPlan = {
  dailyPlan: string[];
  prioritizedTasks: string[];
  suggestedBreaks: string[];
  risksOrWarnings: string[];
  safetyCheckResult: string;
  evaluationScore: number;
  agentCollaboration: string[];
};

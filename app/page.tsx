'use client';

import { FormEvent, useState } from 'react';
import type { DailyPlan } from '@/lib/agents/types';

type FormState = {
  tasks: string;
  meetings: string;
  workingHours: string;
  energyLevel: string;
  mainGoal: string;
};

const initialForm: FormState = {
  tasks: 'Draft capstone demo, review project README, prepare presentation notes',
  meetings: '10:00-10:30 standup, 14:00-15:00 project review',
  workingHours: '09:00-17:30',
  energyLevel: 'Medium',
  mainGoal: 'Finish a polished Kaggle AI Agents Capstone submission',
};

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="result-section">
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    setPlan(null);

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate a daily plan.');
      }

      setPlan(data.plan);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <span className="badge">Kaggle AI Agents Capstone · Concierge Agents</span>
        <h1>Smart Daily Planning Agent</h1>
        <p>
          Create a realistic daily plan with a simple multi-agent workflow powered by Gemini. The API key stays on
          the server and the app avoids databases, login, payments, email, and other external services.
        </p>
      </section>

      <div className="grid">
        <form className="card form" onSubmit={handleSubmit}>
          <label>
            Daily tasks
            <span className="helper">Separate tasks with commas or new lines.</span>
            <textarea value={form.tasks} onChange={(event) => setForm({ ...form, tasks: event.target.value })} />
          </label>

          <label>
            Fixed meetings
            <textarea value={form.meetings} onChange={(event) => setForm({ ...form, meetings: event.target.value })} />
          </label>

          <label>
            Working hours
            <input value={form.workingHours} onChange={(event) => setForm({ ...form, workingHours: event.target.value })} />
          </label>

          <label>
            Energy level
            <select value={form.energyLevel} onChange={(event) => setForm({ ...form, energyLevel: event.target.value })}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>

          <label>
            Main goal of the day
            <input value={form.mainGoal} onChange={(event) => setForm({ ...form, mainGoal: event.target.value })} />
          </label>

          <button disabled={isLoading}>{isLoading ? 'Generating with agents…' : 'Generate Daily Plan'}</button>
          {error ? <div className="error">{error}</div> : null}
        </form>

        <section className="card result">
          {!plan ? (
            <p className="placeholder">
              Your generated plan will appear here with a schedule, priorities, break suggestions, risk warnings,
              safety review, evaluation score, and an explanation of agent collaboration.
            </p>
          ) : (
            <>
              <ListSection title="Daily plan" items={plan.dailyPlan} />
              <ListSection title="Prioritized tasks" items={plan.prioritizedTasks} />
              <ListSection title="Suggested breaks" items={plan.suggestedBreaks} />
              <ListSection title="Risks or overload warnings" items={plan.risksOrWarnings} />
              <section className="result-section">
                <h3>Safety check result</h3>
                <p>{plan.safetyCheckResult}</p>
              </section>
              <section className="result-section">
                <h3>Evaluation score</h3>
                <span className="score">{plan.evaluationScore}/10</span>
              </section>
              <section className="result-section">
                <h3>How the agents collaborated</h3>
                <div className="agent-flow">
                  {plan.agentCollaboration.map((step) => <div className="agent-step" key={step}>{step}</div>)}
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

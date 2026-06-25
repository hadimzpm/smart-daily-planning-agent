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

const agentNames = [
  'Coordinator Agent',
  'Task Analyzer Agent',
  'Schedule Builder Agent',
  'Safety Guardrail Agent',
  'Evaluation Agent',
];

function TimelineBlock({ items }: { items: string[] }) {
  return (
    <div className="timeline-list">
      {items.map((item, index) => (
        <div className="timeline-item" key={item}>
          <span className="timeline-marker">{String(index + 1).padStart(2, '0')}</span>
          <p>{item}</p>
        </div>
      ))}
    </div>
  );
}

function NumberedRows({ items }: { items: string[] }) {
  return (
    <div className="numbered-list">
      {items.map((item, index) => (
        <div className="numbered-row" key={item}>
          <span>{index + 1}</span>
          <p>{item}</p>
        </div>
      ))}
    </div>
  );
}

function CalloutGrid({ items }: { items: string[] }) {
  return (
    <div className="callout-grid">
      {items.map((item) => (
        <div className="callout-card" key={item}>
          {item}
        </div>
      ))}
    </div>
  );
}

function DocumentSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="document-block">
      <span className="block-eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      {children}
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
    <main className="workspace-shell">
      <header className="document-header">
        <p className="workspace-label">Kaggle AI Agents Capstone / Concierge Agents</p>
        <h1>Smart Daily Planning Agent</h1>
        <p className="workspace-description">
          A quiet daily planning workspace that turns tasks, meetings, working hours, energy, and one main goal into a
          structured plan using a simple multi-agent workflow.
        </p>
      </header>

      <div className="workspace-grid">
        <aside className="input-panel" aria-label="Planning inputs">
          <div className="panel-title-row">
            <div>
              <p className="panel-kicker">Planning inputs</p>
              <h2>Today</h2>
            </div>
            <span className="panel-status">Draft</span>
          </div>

          <form className="planning-form" onSubmit={handleSubmit}>
            <div className="field-block">
              <label htmlFor="tasks">Daily tasks</label>
              <p>List everything competing for attention today.</p>
              <textarea
                id="tasks"
                value={form.tasks}
                onChange={(event) => setForm({ ...form, tasks: event.target.value })}
              />
            </div>

            <div className="field-block">
              <label htmlFor="meetings">Fixed meetings</label>
              <p>Include times and anything that cannot move.</p>
              <textarea
                id="meetings"
                value={form.meetings}
                onChange={(event) => setForm({ ...form, meetings: event.target.value })}
              />
            </div>

            <div className="field-pair">
              <div className="field-block compact">
                <label htmlFor="workingHours">Working hours</label>
                <input
                  id="workingHours"
                  value={form.workingHours}
                  onChange={(event) => setForm({ ...form, workingHours: event.target.value })}
                />
              </div>

              <div className="field-block compact">
                <label htmlFor="energyLevel">Energy level</label>
                <select
                  id="energyLevel"
                  value={form.energyLevel}
                  onChange={(event) => setForm({ ...form, energyLevel: event.target.value })}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            <div className="field-block">
              <label htmlFor="mainGoal">Main goal of the day</label>
              <p>The outcome the plan should protect first.</p>
              <input
                id="mainGoal"
                value={form.mainGoal}
                onChange={(event) => setForm({ ...form, mainGoal: event.target.value })}
              />
            </div>

            <div className="submit-area">
              <button disabled={isLoading}>{isLoading ? 'Building your plan with agents...' : 'Generate Daily Plan'}</button>
              {error ? <p className="inline-error">{error}</p> : null}
            </div>
          </form>
        </aside>

        <section className="document-panel" aria-live="polite">
          <div className="document-toolbar">
            <div>
              <p className="panel-kicker">Generated plan</p>
              <h2>Daily planning document</h2>
            </div>
            <span className="panel-status">Agent workflow</span>
          </div>

          {isLoading ? (
            <div className="empty-document loading-document">
              <span className="loading-line" />
              <h3>Building your plan with agents...</h3>
              <p>The coordinator, analyzer, scheduler, guardrail, and evaluator are preparing a structured plan.</p>
            </div>
          ) : !plan ? (
            <div className="empty-document">
              <h3>Your plan will appear here</h3>
              <p>
                Add your tasks, meetings, working hours, energy level, and main goal to generate a structured daily plan.
              </p>
            </div>
          ) : (
            <article className="plan-document">
              <DocumentSection eyebrow="Timeline" title="Daily plan">
                <TimelineBlock items={plan.dailyPlan} />
              </DocumentSection>

              <DocumentSection eyebrow="Focus" title="Prioritized tasks">
                <NumberedRows items={plan.prioritizedTasks} />
              </DocumentSection>

              <DocumentSection eyebrow="Pacing" title="Suggested breaks">
                <CalloutGrid items={plan.suggestedBreaks} />
              </DocumentSection>

              <DocumentSection eyebrow="Constraints" title="Risks or overload warnings">
                <div className="warning-block">
                  {plan.risksOrWarnings.map((risk) => (
                    <p key={risk}>{risk}</p>
                  ))}
                </div>
              </DocumentSection>

              <div className="document-columns">
                <DocumentSection eyebrow="Guardrail" title="Safety check result">
                  <div className="status-block">{plan.safetyCheckResult}</div>
                </DocumentSection>

                <DocumentSection eyebrow="Evaluation" title="Evaluation score">
                  <div className="score-block">
                    <strong>{plan.evaluationScore}/10</strong>
                    <span>Plan quality score from the evaluation agent.</span>
                  </div>
                </DocumentSection>
              </div>

              <DocumentSection eyebrow="Process" title="How the agents collaborated">
                <div className="process-list">
                  {agentNames.map((agentName, index) => (
                    <div className="process-row" key={agentName}>
                      <span>{agentName}</span>
                      <p>{plan.agentCollaboration[index] ?? 'Contributed to the final structured plan.'}</p>
                    </div>
                  ))}
                </div>
              </DocumentSection>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}

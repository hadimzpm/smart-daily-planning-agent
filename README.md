# smart-daily-planning-agent

A simple **AI Personal Productivity Concierge** for the Kaggle AI Agents Capstone project. The app helps a user turn daily tasks, fixed meetings, working hours, energy level, and a main goal into a practical daily plan using a simulated multi-agent workflow powered by the Gemini API.

## Track: Concierge Agents

This project fits the **Concierge Agents** track because it acts like a lightweight personal productivity concierge. It gathers user context, coordinates specialist agents, produces a useful daily plan, and explains how the agent team collaborated.

## Project overview

Users open the homepage and enter:

1. Daily tasks
2. Fixed meetings
3. Working hours
4. Energy level
5. Main goal of the day

When the user clicks **Generate Daily Plan**, the client calls the server-side `/api/plan` route. The backend runs a multi-agent planning sequence with Gemini and returns:

1. Daily plan
2. Prioritized tasks
3. Suggested breaks
4. Risks or overload warnings
5. Safety check result
6. Evaluation score
7. Explanation of how the agents collaborated

## Agent architecture

The `/api/plan` route orchestrates five simple agents:

1. **Coordinator Agent** - reviews the user input and defines how the specialist agents should collaborate.
2. **Task Analyzer Agent** - prioritizes tasks, considers dependencies, and identifies potential overload.
3. **Schedule Builder Agent** - turns the analysis into a realistic schedule that respects meetings and working hours.
4. **Safety Guardrail Agent** - checks for overwork, missing breaks, unrealistic planning, and unsafe productivity advice.
5. **Evaluation Agent** - produces the final structured JSON response and assigns a 1-10 quality score.

The workflow is intentionally simple and transparent so it is easy to understand, demo, and deploy.

## Key concepts demonstrated

- **Multi-agent decomposition:** separate agents handle coordination, analysis, scheduling, safety, and evaluation.
- **Server-side LLM calls:** Gemini is called only from the Next.js API route.
- **Structured output:** the final response is normalized into predictable fields for the UI.
- **Guardrails:** a dedicated safety agent checks for overload and healthier pacing.
- **Vercel-ready architecture:** the app uses Next.js App Router and environment variables without a database.

## Security notes

- The Gemini API key is read from `process.env.GEMINI_API_KEY` on the server only.
- The app never exposes `GEMINI_API_KEY` to client-side code.
- Do not prefix the key with `NEXT_PUBLIC_`.
- There is no Supabase integration, database, authentication, login, payment flow, email, or SMS.
- Gemini is the only external API used by the application.
- `GEMINI_MODEL` should be set to `gemini-2.5-flash` for deployment consistency.

## Evaluation notes

The app calls Gemini first. If Gemini is temporarily unavailable due to high demand, the app uses a deterministic fallback mode so the Kaggle demo remains reliable.

The Evaluation Agent scores the generated plan from **1 to 10** based on practicality, alignment with the user's main goal, respect for meetings and working hours, inclusion of breaks, and safety considerations.

The output is intended for productivity planning support only. Users should review and adjust the plan based on real-world constraints, personal needs, and any urgent responsibilities.

## How to run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Gemini key and optional model name to `.env.local`:

   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## How to deploy on Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add the environment variable `GEMINI_API_KEY` in the Vercel project settings.
4. Add `GEMINI_MODEL=gemini-2.5-flash` for deployment consistency.
5. Deploy with the default Next.js settings.

## Available scripts

```bash
npm run dev
npm run build
npm run start
```

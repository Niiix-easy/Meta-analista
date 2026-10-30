# Meta Ads AI Platform: Command Center

A proactive, command-center dashboard for Meta Ads, moving beyond passive monitoring to AI-driven campaign optimization, "what-if" scenario planning, and proactive management actions.

## User Review & Critical Decisions

> [!IMPORTANT]
> This plan replaces the previous dashboard-focused approach with an "AI-First Command Center" design.

- **Confirmed Decisions**: Real API/proxy setup (Express.js), Shadcn UI + Tailwind, and focus on AI insights, charts, and campaign tools.
- **Architectural Shift**: We are prioritizing *actions* over *views*. The primary landing interface is an "Opportunities & Alerts" feed that guides the user, with simulation capabilities for budgeting and strategy adjustments before committing changes.

## 1. Overview & Core Concept

- **What It Does**: An enterprise-grade AI agent dashboard for Meta Ads. It monitors campaign health, but specifically flags *opportunities for improvement* and allows users to simulate the impact of strategy changes (budget, creative) before pushing them to the Meta Ads API.
- **Target Audience / Persona**: Growth managers who need proactive optimization and risk mitigation, not just vanity reporting.
- **Key Value**: Reduced cognitive load through AI-prioritized actions and high-confidence strategy simulations.

## 2. User Experience & Visual Design

- **Visual Identity & Theme**:
    - *Aesthetic Direction*: Command Center / Utility (minimal, high-contrast, technical).
    - *Layout*: Asymmetric focus on the AI Agent panel on the right (30% width) for proactive alerts, with Campaign Performance charts on the left (70% width).
    - *Color Palette*: Slate dark theme with sharp functional accents—green for growth opportunities, crimson for critical issues. Tabular numerals for all metrics.
- **Key User Flows**:
    - *Command View*: AI Agent presents "Top 3 Opportunities" and "Alerts". Clicking an opportunity opens a simulation dialog.
    - *Scenario Simulation*: User adjusts budget/strategy parameters, AI predicts performance shifts based on historical data.
    - *Execution*: User approves the simulation to update campaign status.

## 3. Key Product Decisions & Trade-Offs

- **Simulation-First Architecture**:
    - *Chosen Approach*: Integration of a "What-If" simulation layer powered by Gemini API, analyzing campaign history and current trends.
    - *Why*: Allows users to validate optimizations, minimizing performance risk compared to direct budget/status changes.
- **Agentic Insights**:
    - *Chosen Approach*: A dedicated right-sidebar "AI Agent" panel that continuously analyzes incoming real-time performance, pushing proactive tasks (e.g., "Budget reallocation opportunity detected").
    - *Why*: Directs user attention where it matters most, unlike standard dashboard grids.

## 4. Technical Architecture & Data Strategy

```text
┌───────────────────────────┐
│     Client (React/Vite)   │
│ (Insights / Simulator)    │
└─────────────┬─────────────┘
              │ (Simulations / Actions)
┌─────────────▼─────────────┐
│   Express API Proxy       │
├─────────────┬─────────────┤
│ Gemini (Insights Engine)  │
│ Simulation Engine         │
└───────────────────────────┘
```

- **Data Model**: Augmented campaign entities (Budget, ROAS, CPA, Trendline data) + Simulation scenario templates.
- **Interactive Component Mapping**:
    - *AI Agent Sidebar*: WebSocket-powered notification stream (simulated) of real-time insights.
    - *Simulation Modal*: Interactive form using Shadcn `Dialog` that feeds parameters to the proxy's simulation endpoint.
    - *Command Table*: Table highlighting critical campaign metrics needing action.

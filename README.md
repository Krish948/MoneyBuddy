# MoneyBuddy

MoneyBuddy is an AI-powered personal finance tracker built with React, TypeScript, Vite, and Supabase.

It helps users:
- track income and expenses
- set monthly budgets by category
- analyze spending trends with charts
- export filtered transactions to CSV
- generate AI spending narratives from monthly summaries

## Table of Contents

- [Highlights](#highlights)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
	- [1. Prerequisites](#1-prerequisites)
	- [2. Install dependencies](#2-install-dependencies)
	- [3. Configure environment variables](#3-configure-environment-variables)
	- [4. Run the app](#4-run-the-app)
- [Supabase Setup](#supabase-setup)
	- [Database schema](#database-schema)
	- [Edge Function: AI Insights](#edge-function-ai-insights)
- [Available Scripts](#available-scripts)
- [Current Routes](#current-routes)
- [Notes](#notes)
- [Testing](#testing)
- [Build for Production](#build-for-production)

## Highlights

- Email/password authentication with Supabase Auth
- Protected app routes and session persistence
- Real-time transaction and budget updates via Supabase Realtime
- Dashboard cards for balance, monthly income/expense, and net flow
- Analytics page with search/filter and CSV export
- Budget tracking with over-limit and near-limit indicators
- AI Insights card with:
	- rules-based quick insights
	- generated narrative via Supabase Edge Function

## Tech Stack

- Frontend: React 18, TypeScript, Vite
- UI: Tailwind CSS, shadcn/ui, Radix UI, Lucide icons
- State/Data: TanStack Query, React hooks
- Backend: Supabase (Auth, Postgres, Realtime, Edge Functions)
- Charts: Recharts
- Validation: Zod
- Testing: Vitest, Testing Library

## Project Structure

```text
src/
	components/         # Reusable UI and feature components
	components/charts/  # Chart components
	contexts/           # Auth context
	hooks/              # Data hooks (transactions, budgets)
	integrations/       # Supabase client + generated types
	lib/                # Finance helpers and utilities
	pages/              # Route pages
	test/               # Vitest setup and tests
supabase/
	functions/
		ai-insights/      # Edge function for AI narrative generation
	migrations/         # SQL schema + policies
```

## Getting Started

### 1. Prerequisites

- Node.js 18+
- npm (or bun/pnpm/yarn)
- A Supabase project

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

These values are used by `src/integrations/supabase/client.ts`.

### 4. Run the app

```bash
npm run dev
```

The Vite dev server runs on port `3000` by default.

## Supabase Setup

### Database schema

Migration file:

- `supabase/migrations/20260419044250_bb61b129-0f4c-4a35-b153-00ef3241accb.sql`

It creates:
- `transactions` table
- `budgets` table
- `transaction_type` enum (`income`, `expense`)
- Row Level Security (RLS) policies so users access only their own data
- update triggers for `updated_at`
- realtime publication for both tables

### Edge Function: AI Insights

Function path:

- `supabase/functions/ai-insights/index.ts`

Required secret for the function runtime:

```bash
LOVABLE_API_KEY=your_api_key
```

Example (Supabase CLI):

```bash
supabase secrets set LOVABLE_API_KEY=your_api_key
```

The function:
- accepts monthly summary data
- sends a prompt to the configured AI gateway
- returns a short narrative with actionable advice

## Available Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run build:dev` - development-mode build
- `npm run preview` - preview built app
- `npm run lint` - run ESLint
- `npm run test` - run tests once
- `npm run test:watch` - run tests in watch mode

## Current Routes

- `/auth` - sign in/sign up
- `/` - dashboard
- `/add` - add transaction
- `/analytics` - analytics, filtering, CSV export
- `/budgets` - monthly budgets
- `/profile` - account and lifetime summary

## Notes

- The browser metadata/title uses the MoneyBuddy brand.
- UI branding has been standardized to MoneyBuddy across the app.

## Testing

Example test setup is included under `src/test/`.

Run:

```bash
npm run test
```

## Build for Production

```bash
npm run build
npm run preview
```

Deploy the generated `dist/` folder using your preferred static hosting provider.


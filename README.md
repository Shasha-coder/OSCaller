# OSCaller

Home-service dispatch with a voice agent. A customer submits a plumbing, electrical, HVAC, or locksmith request; the platform finds the nearest available technician and Aria (Retell) calls to confirm the job.

**Live:** [oscaller.com](https://oscaller.com)

---

## Table of contents

1. [What it does](#what-it-does)
2. [Tech stack](#tech-stack)
3. [Getting started](#getting-started)
4. [Environment variables](#environment-variables)
5. [Twilio + Retell (required for calls)](#twilio--retell-required-for-calls)
6. [Project layout](#project-layout)
7. [Security](#security)
8. [Scripts](#scripts)

---

## What it does

- Customer intake: service type, location, photos/video, urgency
- Gemini vision analysis of uploaded media
- Geo dispatch: nearest online providers, accept/decline, live tracking
- **Aria** (Retell) outbound voice call to confirm address, issue, and dispatch consent
- SMS OTP via Twilio
- Stripe authorize / capture / refund on completed jobs
- Admin + provider dashboards
- Safe-mode degradation when AI, payments, or dispatch are down

## Tech stack

| Layer | Technology |
|-------|------------|
| App | Next.js 16 (App Router, TypeScript) |
| UI | Tailwind CSS 4, Radix, GSAP |
| Auth + data | Supabase (Postgres, Auth, RLS) |
| Maps | Google Maps JavaScript + Geocoding APIs |
| Voice | Retell AI (custom LLM stream) |
| SMS / voice numbers | Twilio |
| Payments | Stripe |
| Media analysis | Google Gemini |
| Cache / OTP | Upstash Redis |
| Deploy | Vercel — [oscaller.com](https://oscaller.com) |

## Getting started

**Prerequisites:** Node.js 20+.

```bash
git clone https://github.com/Shasha-coder/OSCaller.git
cd OSCaller
copy .env.example .env.local
npm install
```

Fill `.env.local`, then in Supabase → SQL Editor run:

1. `supabase/schema.sql`
2. Optional: `scripts/004-retell-agents.sql`, `scripts/006-retell-webhook-tables.sql`

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The marketing site and request flow work without Twilio; outbound calls and SMS OTP need the keys below.

## Environment variables

Copy `.env.example` → `.env.local`. **Never commit real values.** On Vercel, set the same keys under Project → Settings → Environment Variables, then redeploy.

| Group | Variables |
|-------|-----------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Maps | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (browser), `GOOGLE_MAPS_API_KEY` (server geocode) |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_MESSAGING_SERVICE_SID` |
| Retell | `RETELL_API_KEY`, `RETELL_WEBHOOK_SECRET`, `RETELL_DEFAULT_AGENT_ID`, `RETELL_DEFAULT_FROM_NUMBER` |
| Stripe | `STRIPE_SECRET_KEY` |
| Gemini | `GEMINI_API_KEY` |
| Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

## Twilio + Retell (required for calls)

The live site will not place calls until these are current. Expired trial numbers are the usual failure.

### 1. Twilio number

1. [Twilio Console](https://console.twilio.com) → Phone Numbers → Buy a number with **Voice + SMS**.
2. Put it in `.env.local` / Vercel as `TWILIO_PHONE_NUMBER` in E.164 (`+15551234567`).
3. Optional: Messaging Service SID → `TWILIO_MESSAGING_SERVICE_SID` (preferred for OTP).
4. Account SID + Auth Token → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.

### 2. Import that number into Retell

Retell must own the caller ID used for Aria:

1. Retell dashboard → Phone Numbers → Import from Twilio (or buy in Retell).
2. Attach the number to the Aria agent.
3. Set `RETELL_DEFAULT_FROM_NUMBER` to that same E.164 value.
4. Set `RETELL_DEFAULT_AGENT_ID` to the Aria agent id (`agent_…`).

Country-specific numbers live in the `retell_agents` / `twilio_numbers` tables so US, CA, and MX calls present a local caller ID. If those rows are empty, the env fallbacks above are used.

### 3. Webhooks (production)

| Endpoint | URL |
|----------|-----|
| Retell webhook | `https://oscaller.com/api/retell/webhook` |
| Custom LLM stream | `https://oscaller.com/api/retell/llm-stream` |
| Outbound trigger | `https://oscaller.com/api/retell/call` |

Full agent prompt and dashboard steps: [`docs/RETELL_SETUP_INSTRUCTIONS.md`](docs/RETELL_SETUP_INSTRUCTIONS.md).

### 4. Google Maps

Enable **Maps JavaScript API** and **Geocoding API** on the same Google Cloud key. Restrict the `NEXT_PUBLIC_` key to `oscaller.com` and `localhost:3000`.

## Project layout

```
app/
  page.tsx              Customer request + map
  join/                 Provider onboarding
  provider/             Technician dashboard
  admin/                Ops + Retell agents
  api/
    retell/             Call trigger, webhook, custom LLM
    dispatch/           Match + accept
    otp/                Twilio SMS OTP
    payments/           Stripe authorize / capture / refund
    requests/           CRUD, media, tracking
    video-analysis/     Gemini

components/             Map, intake, tracking, UI
lib/                    Dispatch scoring, Twilio router, Retell, Supabase
supabase/               Schema + migrations
docs/                   Retell production setup
```

## Security

- `.env*` is gitignored except `.env.example` (placeholders only).
- Service-role and Stripe secret keys are server-only.
- Restrict the public Maps key by HTTP referrer.
- Rotate Twilio auth tokens and Retell keys if they ever appeared in git or chat.
- API routes accept a Bearer JWT or `X-API-Key` (`OSCALLER_API_KEY`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Deploy

Already on Vercel at [oscaller.com](https://oscaller.com). After changing Twilio / Retell / Maps keys, update Vercel env and **Redeploy**. No code change is required for a number rotation.

---

Private portfolio project.

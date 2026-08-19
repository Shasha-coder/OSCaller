# OSCaller

**Live: [oscaller.com](https://oscaller.com)**

Someone needs a plumber at 11pm. They drop a pin, maybe a photo of the leak. OSCaller finds the nearest available tech. **Aria** calls the customer, confirms the address and the job, then dispatch starts. The tech sees the job; the customer can track it.

---

## Stack

Next.js 16 · TypeScript · Tailwind 4 · Supabase · Google Maps · Retell · Twilio · Stripe · Gemini · Upstash · Vercel

## Run it

```bash
git clone https://github.com/Shasha-coder/OSCaller.git
cd OSCaller
copy .env.example .env.local
npm install
```

Load `supabase/schema.sql` in the Supabase SQL editor, then:

```bash
npm run dev
```

The site and request flow work without Twilio. **Calls and SMS OTP need a current number** — see below.

## Making calls work (Twilio + Retell)

If Aria is silent in production, the number is almost always expired. This is config, not a code change:

1. Twilio Console → buy a **Voice + SMS** number → `TWILIO_PHONE_NUMBER` (`+1555…`)
2. Same SID / token → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
3. Import that number into Retell, attach it to Aria
4. `RETELL_DEFAULT_FROM_NUMBER` = that number, `RETELL_DEFAULT_AGENT_ID` = `agent_…`
5. Vercel env → **Redeploy**

Webhooks in production:

| | |
|---|---|
| Retell | `https://oscaller.com/api/retell/webhook` |
| Custom LLM | `https://oscaller.com/api/retell/llm-stream` |

Maps: enable **Maps JavaScript API** + **Geocoding API**. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (browser) and optionally `GOOGLE_MAPS_API_KEY` (server). Restrict the public key to `oscaller.com` and `localhost:3000`.

Full agent setup: [docs/RETELL_SETUP_INSTRUCTIONS.md](docs/RETELL_SETUP_INSTRUCTIONS.md).

## Layout

```
app/page.tsx          customer request + map
app/join              provider onboarding
app/provider          technician workspace
app/admin             ops + Retell agents
app/api/retell        outbound call, webhook, custom LLM
app/api/dispatch      match / accept
app/api/otp           Twilio SMS
lib/dispatch.ts       scoring (distance, rating, near-miss)
```

## Env

`.env.example` is placeholders only. Real keys live in `.env.local` or Vercel.

`npm run dev` · `npm run build` · `npm run lint`

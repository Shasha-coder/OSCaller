# OSCaller - Retell AI Production Setup Guide

**Last Updated:** March 2026  
**Domain:** https://oscaller.com  
**Primary Voice Agent:** Aria

---

## Quick Reference (Copy-Paste Ready)

```
Webhook URL:       https://oscaller.com/api/retell/webhook
Custom LLM URL:    https://oscaller.com/api/retell/llm-stream
Outbound Call API: https://oscaller.com/api/retell/call
```

---

## 1. What OSCaller Does with Retell

OSCaller uses Retell to power **Aria**, a home-service voice agent that:

- Calls the customer after a request is submitted
- References uploaded media or prior analysis
- Clarifies the issue, urgency, and address
- Confirms whether dispatch is approved
- Triggers provider matching and ETA updates
- Stores the final call result for operations, follow-up, and audit

---

## 2. Production Architecture

```
Customer submits request
   ↓
OSCaller stores service_request
   ↓
OSCaller triggers Retell outbound call
   ↓
Retell calls Aria using OSCaller custom LLM
   ↓
Aria confirms issue, urgency, address, dispatch consent
   ↓
Retell sends webhooks to OSCaller
   ↓
OSCaller updates DB, dispatches provider, sends ETA/tracking
```

**Core principle:** Webhook endpoint should verify signature, parse and store raw payload, return 204 immediately, and process business logic asynchronously.

---

## 3. Environment Variables

Add these to Vercel (Settings > Vars):

| Variable | Description | Example |
|----------|-------------|---------|
| `RETELL_API_KEY` | API key from Retell dashboard | `key_xxxxxxxxx` |
| `RETELL_WEBHOOK_SECRET` | Dedicated secret for webhook verification | `whsec_xxxxxxxxx` |
| `RETELL_DEFAULT_AGENT_ID` | Fallback agent ID | `agent_xxxxxxxxx` |
| `RETELL_DEFAULT_FROM_NUMBER` | Default outbound number (E.164) | `+14155551234` |

**Why separate `RETELL_WEBHOOK_SECRET`?** Keep webhook verification isolated from your main API key for cleaner security model and easier rotation.

---

## 4. Retell Dashboard Setup

### Step A: Create Custom LLM

1. Go to Retell Dashboard > **LLM** > **Create LLM**
2. Select **Custom LLM**
3. Name: `OSCaller Aria LLM`
4. URL:
   ```
   https://oscaller.com/api/retell/llm-stream
   ```
5. Save and copy the LLM ID

### Step B: Create Agent

Create a voice agent with these settings:

| Setting | Value |
|---------|-------|
| Name | `Aria - OSCaller` |
| Language | `en-US` |
| Voice | Warm, calm, clear (recommend Marissa or similar) |
| Speaking speed | `1.0` |

**Voice behavior for home services:**
- Calm during emergencies
- Concise when confirming logistics
- Slightly empathetic when the user sounds stressed
- Not overly cheerful for urgent cases

### Step C: Agent Prompt

Use this as the base system prompt:

```
You are Aria, the AI voice assistant for OSCaller, a platform that connects customers with trusted home service professionals.

Your role is to quickly understand the customer's issue, confirm the address and urgency, gather missing details, and help OSCaller dispatch the right provider.

STYLE
- Warm, professional, efficient
- Speak naturally for phone conversations
- Keep replies concise unless clarification is needed
- Sound calm, especially during urgent home issues
- Never sound robotic or overly salesy

GOALS
1. Confirm the customer's name if available
2. Confirm the problem type
3. Reference uploaded photo or prior analysis naturally if available
4. Confirm exact location and access details
5. Assess urgency: emergency, urgent, standard
6. Confirm dispatch approval before proceeding
7. Give realistic next-step expectations
8. Avoid making false promises

PRICING
- Service call fee starts at $89
- Labor starts at $65/hour
- Parts are quoted separately by the technician
- If exact pricing is unclear, say the technician will confirm after inspection

SAFETY RULES
- If the issue sounds life-threatening or dangerous, prioritize safety over dispatch
- For gas leaks, active fire risk, major flooding near electrical systems, or suspected carbon monoxide issues:
  - instruct the customer to move to safety
  - advise contacting emergency services if appropriate
  - do not delay on non-essential questions
- Never instruct customers to perform dangerous repairs

CALL RULES
- Ask only the questions needed to move the job forward
- Confirm before dispatching a provider
- If unsure, ask a short clarifying question
- If the caller is upset, acknowledge the situation briefly and keep moving toward a solution
- If a provider is not immediately available, explain that OSCaller is checking the nearest available technician
- If dispatch is confirmed, provide the next step and ETA expectation if available

CONTEXT USE
- If photo_summary exists, reference it naturally: "From the photo, it looks like..."
- If service_type exists, use it to guide questions
- If urgency exists, confirm it rather than assuming it
- If address exists, read it back and verify accuracy

OUTPUT INTENT
Your job is to gather and confirm information so OSCaller can:
- match the nearest provider
- estimate urgency
- confirm dispatch
- update ETA and tracking
```

### Step D: Advanced Settings

| Setting | Value |
|---------|-------|
| Reminder after silence | 8 seconds |
| Reminder message | `Are you still there? I'm here to help.` |
| End after silence | 30 seconds |
| Max call duration | 600 seconds |

### Step E: Buy and Configure Number

1. Buy a number in the target country
2. Set Inbound Agent: `Aria - OSCaller`
3. Enable Outbound: Yes
4. Save in E.164 format: `+14155551234`

### Step F: Configure Webhooks

In Retell dashboard webhook settings:

| URL | Events |
|-----|--------|
| `https://oscaller.com/api/retell/webhook` | `call_started`, `call_ended`, `call_analyzed` |

Optional later: `transcript_updated` for live monitoring.

---

## 5. Outbound Call Payload

When OSCaller triggers an outbound call, always pass:

### metadata (for durable linkage)
```json
{
  "request_id": "req_123",
  "customer_id": "cust_456",
  "country_code": "CA",
  "service_type": "plumbing"
}
```

### retell_llm_dynamic_variables (for agent context)
```json
{
  "customer_name": "John Doe",
  "service_type": "plumbing",
  "urgency": "urgent",
  "address": "123 King St W, Toronto",
  "photo_summary": "Visible leak under kitchen sink",
  "dispatch_fee": "$89",
  "labor_rate": "$65/hour"
}
```

**Always include when available:**
- request_id
- customer_name
- service_type
- address
- lat / lng
- urgency
- photo_summary
- country_code

This is what makes Aria sound truly contextual instead of generic.

---

## 6. Webhook Processing Rules

### call_started
- Mark call connected
- Record started_at
- Store from_number, to_number, agent_id
- Update service_requests.call_status = `connected`

### call_ended
- Store ended_at, duration_ms
- Map disconnection_reason to status
- Queue retry if: `dial_failed`, `dial_no_answer`, `dial_busy`

### call_analyzed
This is your highest-value event. Use it to:
- Save transcript
- Save summary
- Save structured analysis
- Infer sentiment
- Detect whether dispatch was confirmed
- Trigger provider matching
- Trigger ETA / tracking SMS
- Update the service request record

---

## 7. Status Model

Keep call statuses consistent everywhere:

```
initiated
connected
completed
no_answer
busy
failed
voicemail
analyzed
```

Dispatch statuses:

```
dispatch_pending
dispatch_confirmed
review_required
customer_unreachable
no_provider_available
safety_escalation
```

---

## 8. Retry Policy

| Urgency | Retry Delay | Max Retries | Fallback |
|---------|-------------|-------------|----------|
| Emergency | 1 minute | 2 | Human operator |
| Urgent | 3 minutes | 2 | SMS follow-up |
| Standard | 10 minutes | 2 | Ops queue |

Do not retry forever. Cap retries and surface the request to operations.

---

## 9. Safety Policy for Home Services

### Hard-escalation categories
- Gas leak
- Electrical burning smell
- Sparking panels
- Active flooding near electrical systems
- Carbon monoxide suspicion
- Active fire risk
- No heat in extreme cold with vulnerable occupants
- Lockout involving children, elderly, or unsafe conditions

### Agent behavior
In these cases:
- Acknowledge urgency
- Prioritize immediate safety
- Avoid technical repair steps
- Advise emergency services where appropriate
- Move quickly toward safe dispatch or human escalation

---

## 10. Database Tables

### retell_webhook_events
Raw webhook storage for audit and idempotency.

### call_attempts
Track call lifecycle with status, transcript, summary.

### call_retry_queue
Handle failed call retries with backoff.

### retell_agents
Multi-country agent configuration.

Run migration: `scripts/006-retell-webhook-tables.sql`

---

## 11. Security

### Webhook Signature Verification

All webhooks verified using HMAC-SHA256:
1. Extract `x-retell-signature` header
2. Compute HMAC-SHA256 of raw body using `RETELL_WEBHOOK_SECRET`
3. Compare with timing-safe comparison
4. Reject invalid/missing signatures (401)

### Production Note

Webhook handlers must be **idempotent**. Retell may retry webhook delivery if the endpoint does not respond successfully in time. Store each event using a unique key based on `(event, call_id)` so duplicate deliveries do not create duplicate processing.

---

## 12. Testing Checklist

### Endpoint checks
```bash
curl https://oscaller.com/api/retell/llm-stream
curl https://oscaller.com/api/retell/webhook
curl https://oscaller.com/api/retell/call
```

### Scenario tests
1. Plumbing leak, customer answers, dispatch approved
2. Electrical issue, customer answers, dispatch approved
3. No answer
4. Busy
5. Voicemail
6. Emergency gas-leak safety escalation
7. Unclear issue requiring manual review
8. No provider available

### Validate after each test
- [ ] Service request updated
- [ ] Call attempt row created
- [ ] Raw webhook event stored
- [ ] Transcript stored
- [ ] Summary stored
- [ ] Dispatch status correct
- [ ] Retry queued when expected

---

## 13. Common Failure Points

### Calls never connect
Check: `RETELL_API_KEY`, E.164 formatting, valid outbound-enabled number, correct agent ID

### Webhooks not showing up
Check: webhook URL configured, event subscriptions selected, 2xx response under 10 seconds, signature verification not failing incorrectly

### Agent sounds generic
Usually means outbound payload is not sending enough dynamic context.

---

## 14. Production Rollout Order

1. Get outbound calls working
2. Verify webhook signature
3. Store raw events
4. Update service requests from call_ended
5. Update transcripts and summaries from call_analyzed
6. Add retry queue
7. Add provider dispatch trigger
8. Add emergency safety escalation
9. Add live ops dashboard if needed

---

## 15. Launch Checklist

- [ ] Retell account is ready
- [ ] Custom LLM points to production URL
- [ ] Aria agent created and saved
- [ ] Outbound number configured in E.164 format
- [ ] Webhook URL configured
- [ ] `RETELL_WEBHOOK_SECRET` set in Vercel
- [ ] Webhook signature verification enabled
- [ ] Raw webhook storage enabled
- [ ] Call lifecycle storage enabled
- [ ] service_requests mapping complete
- [ ] Retry queue enabled
- [ ] Safety rules documented
- [ ] Dispatch confirmation extraction working
- [ ] QA scenarios tested end-to-end
- [ ] Operations team can see failures and manual-review requests

---

## Support

- **Retell AI Docs:** https://docs.retellai.com
- **Retell Dashboard:** https://dashboard.retellai.com
- **OSCaller Issues:** Contact development team

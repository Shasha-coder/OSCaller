# RetellAI Setup Instructions for OSCaller

**Last Updated:** March 2026  
**Domain:** https://oscaller.com

---

## Quick Reference (Copy-Paste Ready)

| Configuration | Value |
|---------------|-------|
| **Webhook URL** | `https://oscaller.com/api/retell/webhook` |
| **Custom LLM URL** | `https://oscaller.com/api/retell/llm-stream` |
| **Outbound Call API** | `https://oscaller.com/api/retell/call` |

---

## Overview

OSCaller uses RetellAI to power "Aria" - an AI voice agent that:
1. Receives service requests (photo, audio, text) from customers
2. Calls the customer to clarify the problem and gather details
3. Finds the nearest available service provider based on location
4. Dispatches the provider and provides ETA to the customer

---

## Prerequisites

- RetellAI account at [dashboard.retellai.com](https://dashboard.retellai.com)
- Access to Vercel project environment variables
- Phone number(s) for the target country/countries

---

## Step 1: Environment Variables

Add these to your Vercel project (Settings > Environment Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `RETELL_API_KEY` | Your Retell API key | `key_xxxxxxxxxx` |
| `RETELL_DEFAULT_AGENT_ID` | Default agent ID (from Step 3) | `agent_abc123xyz` |
| `RETELL_DEFAULT_FROM_NUMBER` | Default outbound phone number | `+14155551234` |

---

## Step 2: Create Custom LLM in Retell Dashboard

1. Go to [Retell Dashboard](https://dashboard.retellai.com) > **LLM** > **Create LLM**

2. Select **Custom LLM**

3. Configure:
   - **Name:** `OSCaller Aria LLM`
   - **LLM URL (HTTP):**
     ```
     https://oscaller.com/api/retell/llm-stream
     ```

4. **Save** and copy the **LLM ID**

---

## Step 3: Create Agent in Retell Dashboard

1. Go to **Agents** > **Create Agent**

2. **Basic Settings:**
   - **Name:** `Aria - OSCaller`
   - **Language:** `English (US)` (or your target language)
   
3. **Voice Settings:**
   - **Voice Provider:** `ElevenLabs` or `Retell`
   - **Voice:** Recommend `Marissa` or similar warm, professional voice
   - **Speaking Speed:** 1.0 (normal)

4. **LLM Configuration:**
   - **Response Engine:** Select the Custom LLM you created in Step 2
   - **Or** paste this URL directly:
     ```
     https://oscaller.com/api/retell/llm-stream
     ```

5. **General Prompt** (paste this):
   ```
   You are Aria, the AI voice assistant for OSCaller - a platform connecting customers with on-demand home service professionals.

   PERSONALITY:
   - Warm, professional, and efficient
   - Speak naturally as if on a phone call
   - Keep responses concise (1-3 sentences max)
   - Be empathetic when customers describe problems

   FLOW:
   1. Greet warmly: "Hi, this is Aria from OSCaller!"
   2. Reference their uploaded photo/description if available
   3. Ask clarifying questions about the issue
   4. Confirm their location
   5. Assess urgency (emergency/urgent/standard)
   6. Provide estimate and confirm dispatch
   7. Give ETA and tracking info

   PRICING:
   - Service call fee: $89
   - Labor rate: $65/hour
   - Parts quoted separately by technician

   RULES:
   - For emergencies (gas leak, flooding, fire risk), prioritize safety
   - Always confirm before dispatching
   - Reference photos naturally: "I can see from the photo..."
   - If unsure, ask clarifying questions
   ```

6. **Advanced Settings:**
   - **Reminder Message After Silence:** 8 seconds
   - **Reminder Message:** "Are you still there? I'm here to help."
   - **End Call After Silence:** 30 seconds
   - **Max Call Duration:** 600 seconds (10 minutes)

7. **Save** the agent and copy the **Agent ID** (e.g., `agent_abc123xyz`)

---

## Step 4: Purchase & Configure Phone Number

1. Go to **Phone Numbers** > **Buy Number**

2. Select your target country (US, Canada, etc.)

3. Purchase a local number

4. **Configure the number:**
   - **Inbound Agent:** Select `Aria - OSCaller`
   - **Outbound Enabled:** Yes

5. Copy the phone number in E.164 format (e.g., `+14155551234`)

---

## Step 5: Configure Webhooks

Go to **Settings** > **Webhooks** and add these endpoints:

### Webhook Configuration

| Webhook URL | Events to Subscribe |
|-------------|---------------------|
| `https://oscaller.com/api/retell/webhook` | `call_started`, `call_ended`, `call_analyzed` |

**Webhook Details:**

1. Click **Add Webhook**
2. **URL:** `https://oscaller.com/api/retell/webhook`
3. **Events:** Check all three:
   - `call_started` - Triggers when call connects
   - `call_ended` - Triggers when call ends
   - `call_analyzed` - Triggers after call analysis completes
4. **Save**

---

## Step 6: Test the Integration

### Health Check Endpoints

Verify the webhooks are accessible:

```bash
# LLM Stream endpoint
curl https://oscaller.com/api/retell/llm-stream
# Expected: {"status":"ok","service":"retell-llm-stream",...}

# Webhook endpoint
curl https://oscaller.com/api/retell/webhook
# Expected: {"status":"ok","service":"retell-webhook",...}

# Call endpoint
curl https://oscaller.com/api/retell/call
# Expected: {"error":"Missing required fields: request_id, phone"}
```

### Test Outbound Call

```bash
curl -X POST https://oscaller.com/api/retell/call \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "test-123",
    "phone": "YOUR_PHONE_NUMBER",
    "customer_name": "Test User",
    "lat": 43.6532,
    "lng": -79.3832
  }'
```

---

## API Endpoints Reference

### 1. Trigger Outbound Call

**POST** `https://oscaller.com/api/retell/call`

Initiates an AI call to a customer.

```json
{
  "request_id": "uuid-of-service-request",
  "phone": "4165551234",
  "customer_name": "John Doe",
  "country_code": "CA",
  "language": "en-US",
  "lat": 43.6532,
  "lng": -79.3832,
  "service_type": "plumbing"
}
```

**Response:**
```json
{
  "success": true,
  "call_id": "call_xyz789",
  "agent_id": "agent_abc123",
  "status": "registered",
  "message": "Call initiated. Aria will call you now."
}
```

### 2. Check Call Status

**GET** `https://oscaller.com/api/retell/call?call_id=call_xyz789`

### 3. LLM Stream (Retell calls this)

**POST** `https://oscaller.com/api/retell/llm-stream`

This is called by Retell's infrastructure - not directly by OSCaller.

### 4. Webhooks (Retell calls this)

**POST** `https://oscaller.com/api/retell/webhook`

Receives call events from Retell.

---

## Call Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        OSCaller Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Customer submits request                                     │
│     └─> Photo/Audio/Text uploaded                                │
│     └─> AI analyzes media (GPT-4 Vision)                         │
│     └─> Service request created in database                      │
│                                                                  │
│  2. OSCaller triggers Retell call                                │
│     └─> POST /api/retell/call                                    │
│     └─> Retell initiates outbound call                           │
│                                                                  │
│  3. Retell connects to Custom LLM                                │
│     └─> POST /api/retell/llm-stream                              │
│     └─> Aria retrieves context (photo analysis, location)        │
│     └─> Aria converses with customer                             │
│                                                                  │
│  4. During call, Aria:                                           │
│     └─> References uploaded photo: "I see the leak..."           │
│     └─> Asks clarifying questions                                │
│     └─> Confirms location and urgency                            │
│     └─> Queries nearby providers via dispatch system             │
│     └─> Provides estimate and dispatches technician              │
│     └─> Gives ETA and tracking info                              │
│                                                                  │
│  5. Call ends                                                    │
│     └─> Retell sends call_ended webhook                          │
│     └─> Retell sends call_analyzed webhook                       │
│     └─> OSCaller updates service request with transcript         │
│                                                                  │
│  6. Technician receives job                                      │
│     └─> Provider app shows new job with details                  │
│     └─> Customer receives tracking link                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Multi-Country Setup (Optional)

For supporting multiple countries with different phone numbers:

1. **Database Table:** `retell_agents`
   - Each row represents a country-specific agent
   - Fields: `country_code`, `agent_id`, `phone_number`, `language`, `is_active`

2. **Add agents for each country in Retell Dashboard**

3. **Insert into database:**
   ```sql
   INSERT INTO retell_agents (country_code, agent_id, phone_number, name, language, is_active)
   VALUES 
     ('US', 'agent_us_xxx', '+14155551234', 'Aria US', 'en-US', true),
     ('CA', 'agent_ca_xxx', '+16475551234', 'Aria CA', 'en-CA', true),
     ('GB', 'agent_uk_xxx', '+442071234567', 'Aria UK', 'en-GB', true);
   ```

---

## Test Data

The database has been seeded with 7 test providers for testing:

| Provider | Service | Location | Phone |
|----------|---------|----------|-------|
| QuickFix Plumbing | Plumbing | Toronto, ON | +1-416-555-0101 |
| Spark Electric | Electrical | Toronto, ON | +1-416-555-0102 |
| CoolBreeze HVAC | HVAC | North York, ON | +1-416-555-0103 |
| KeyMaster Locksmith | Locksmith | Scarborough, ON | +1-416-555-0104 |
| ProPipe Plumbers | Plumbing | NYC | +1-212-555-0201 |
| Metro Electric | Electrical | Brooklyn, NY | +1-212-555-0202 |
| NYC Climate Control | HVAC | Manhattan, NY | +1-212-555-0203 |

---

## Troubleshooting

### Call not initiating
- Verify `RETELL_API_KEY` is set correctly
- Verify `RETELL_DEFAULT_AGENT_ID` matches your agent
- Check phone number format (must be E.164: `+14155551234`)

### LLM not responding
- Check `https://oscaller.com/api/retell/llm-stream` returns 200
- Verify the agent is configured to use the Custom LLM URL
- Check Vercel logs for errors

### Webhooks not firing
- Verify webhook URL is correct in Retell dashboard
- Check webhook events are subscribed
- Test endpoint: `curl https://oscaller.com/api/retell/webhook`

### Context not appearing in calls
- Verify `request_id` is passed when initiating call
- Check service_request exists in database
- Check media_analysis field is populated

---

## Security

### Webhook Signature Verification

All incoming webhooks are verified using HMAC-SHA256 signatures. The implementation:

1. Extracts `x-retell-signature` header from request
2. Computes HMAC-SHA256 of raw request body using `RETELL_API_KEY`
3. Compares signatures using timing-safe comparison
4. Rejects requests with invalid/missing signatures (returns 401)

**Important:** Never disable signature verification in production.

### Database Tables Created

The integration creates these tables for audit and tracking:

| Table | Purpose |
|-------|---------|
| `retell_webhook_events` | Raw webhook event storage for audit/debugging |
| `call_attempts` | Track each call attempt with status and outcome |

### Service Request Updates

When calls complete, these fields are updated on `service_requests`:

- `retell_call_id` - The active call ID
- `call_status` - pending/ringing/in_progress/completed/failed/no_answer
- `call_transcript` - Full conversation transcript
- `call_recording_url` - Link to call recording
- `call_summary` - AI-generated summary
- `call_sentiment` - positive/negative/neutral/unknown
- `customer_confirmed_dispatch` - Boolean if customer said yes

---

## Support

- **Retell AI Docs:** https://docs.retellai.com
- **Retell Dashboard:** https://dashboard.retellai.com
- **OSCaller Issues:** Contact development team

---

## Checklist

- [ ] Retell account created
- [ ] `RETELL_API_KEY` added to Vercel
- [ ] Custom LLM created pointing to `https://oscaller.com/api/retell/llm-stream`
- [ ] Agent created with Custom LLM
- [ ] `RETELL_DEFAULT_AGENT_ID` added to Vercel
- [ ] Phone number purchased and configured
- [ ] `RETELL_DEFAULT_FROM_NUMBER` added to Vercel
- [ ] Webhooks configured for all 3 events
- [ ] Health check endpoints verified
- [ ] Test call completed successfully

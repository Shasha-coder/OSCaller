import { Redis } from '@upstash/redis'

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/* ─── Key helpers ─── */
export const KEYS = {
    providerStatus: (id: string) => `provider:${id}:status`,
    providerServices: (id: string) => `provider:${id}:services`,
    providerLanguage: (id: string) => `provider:${id}:language`,
    providerLocation: (id: string) => `provider:${id}:location`,
    serviceAvailability: (service: string) => `svc:${service}:available`,
    activeRequests: 'requests:active',
    requestDetail: (id: string) => `req:${id}`,
    requestLanguage: (id: string) => `req:${id}:lang`,
    twilioNumber: (country: string) => `twilio:${country}:numbers`,
    agentContext: (requestId: string) => `agent:ctx:${requestId}`,
    systemStats: 'system:stats',
} as const

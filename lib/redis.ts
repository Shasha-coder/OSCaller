import { Redis } from '@upstash/redis'

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/* ─── Key helpers ─── */
export const KEYS = {
    technicianStatus: (id: string) => `tech:${id}:status`,
    technicianServices: (id: string) => `tech:${id}:services`,
    serviceAvailability: (service: string) => `svc:${service}:available`,
    activeRequests: 'requests:active',
    requestDetail: (id: string) => `req:${id}`,
    systemStats: 'system:stats',
} as const

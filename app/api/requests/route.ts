import { NextRequest, NextResponse } from 'next/server'
import { redis, KEYS } from '@/lib/redis'

export const dynamic = 'force-dynamic'

/**
 * GET /api/requests
 * Returns service requests with optional filters.
 * Query params: ?status=submitted|searching|en-route|completed&service=plumbing&limit=20
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const statusFilter = searchParams.get('status')
        const serviceFilter = searchParams.get('service')
        const limit = parseInt(searchParams.get('limit') || '20')

        // Mock request data — in production, this comes from Supabase
        let requests = [
            { id: 'REQ-001', customer: 'Maria S.', phone: '+15551112222', service: 'plumbing', priority: 'emergency', address: '123 Main St, Apt 4B', description: 'Burst pipe in kitchen', status: 'en-route', technician: 'Peter M.', technician_id: 't1', eta_minutes: 8, lat: 40.7128, lng: -74.006, created_at: '2026-03-03T06:15:00Z' },
            { id: 'REQ-002', customer: 'John D.', phone: '+15553334444', service: 'electrical', priority: 'urgent', address: '456 Oak Ave', description: 'Power outage in half the house', status: 'searching', technician: null, technician_id: null, eta_minutes: null, lat: 40.7180, lng: -73.998, created_at: '2026-03-03T06:22:00Z' },
            { id: 'REQ-003', customer: 'Sarah L.', phone: '+15555556666', service: 'hvac', priority: 'standard', address: '789 Pine Rd', description: 'AC not cooling', status: 'arrived', technician: 'James K.', technician_id: 't2', eta_minutes: 0, lat: 40.7090, lng: -74.015, created_at: '2026-03-03T05:45:00Z' },
            { id: 'REQ-004', customer: 'Alex W.', phone: '+15557778888', service: 'locksmith', priority: 'emergency', address: '321 Elm St', description: 'Locked out of apartment', status: 'submitted', technician: null, technician_id: null, eta_minutes: null, lat: 40.7200, lng: -74.002, created_at: '2026-03-03T06:30:00Z' },
            { id: 'REQ-005', customer: 'Chris B.', phone: '+15559990000', service: 'plumbing', priority: 'standard', address: '654 Cedar Ln', description: 'Slow drain in bathroom', status: 'completed', technician: 'Peter M.', technician_id: 't1', eta_minutes: 0, lat: 40.7160, lng: -74.008, created_at: '2026-03-03T04:00:00Z' },
        ]

        if (statusFilter) {
            requests = requests.filter(r => r.status === statusFilter)
        }
        if (serviceFilter) {
            requests = requests.filter(r => r.service === serviceFilter)
        }

        requests = requests.slice(0, limit)

        return NextResponse.json({
            requests,
            total: requests.length,
            timestamp: new Date().toISOString(),
        })
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch requests', timestamp: new Date().toISOString() },
            { status: 500 }
        )
    }
}

/**
 * POST /api/requests
 * Create a new service request (from caller agent or customer app).
 * Body: { customer_name, phone, address, service, priority, description, lat?, lng? }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { customer_name, phone, address, service, priority, description, lat, lng } = body

        // Validate required fields
        if (!customer_name || !phone || !address || !service || !priority) {
            return NextResponse.json(
                { error: 'Missing required fields: customer_name, phone, address, service, priority' },
                { status: 400 }
            )
        }

        const validServices = ['plumbing', 'electrical', 'hvac', 'locksmith', 'appliance', 'roofing', 'glass', 'pest']
        if (!validServices.includes(service)) {
            return NextResponse.json(
                { error: `Invalid service. Must be one of: ${validServices.join(', ')}` },
                { status: 400 }
            )
        }

        const validPriorities = ['emergency', 'urgent', 'standard']
        if (!validPriorities.includes(priority)) {
            return NextResponse.json(
                { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
                { status: 400 }
            )
        }

        const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`
        const newRequest = {
            id: requestId,
            customer_name,
            phone,
            address,
            service,
            priority,
            description: description || '',
            status: 'submitted',
            technician: null,
            technician_id: null,
            eta_minutes: null,
            lat: lat || null,
            lng: lng || null,
            created_at: new Date().toISOString(),
        }

        // Store in Redis for real-time access
        await redis.set(KEYS.requestDetail(requestId), JSON.stringify(newRequest), { ex: 86400 }) // 24h TTL
        await redis.lpush(KEYS.activeRequests, requestId)

        return NextResponse.json({
            success: true,
            request: newRequest,
            message: `Request ${requestId} created successfully. A technician will be dispatched shortly.`,
            timestamp: new Date().toISOString(),
        }, { status: 201 })
    } catch {
        return NextResponse.json(
            { error: 'Failed to create request', timestamp: new Date().toISOString() },
            { status: 500 }
        )
    }
}

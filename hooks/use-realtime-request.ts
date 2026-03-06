import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeRequest {
  id: string
  status: string
  service: string
  description: string
  address: string
  
  // Provider info
  provider_id: string | null
  technician_id: string | null
  technician_name: string | null
  
  // GPS
  client_lat: number | null
  client_lng: number | null
  provider_lat: number | null
  provider_lng: number | null
  eta_minutes: number | null
  
  // Verification
  service_code: string | null
  
  // Timestamps
  created_at: string
  assigned_at: string | null
  enroute_at: string | null
  arrival_confirmed_at: string | null
  work_started_at: string | null
  work_completed_at: string | null
  
  // Pricing
  estimated_price_cents: number | null
  final_price_cents: number | null
}

export interface ProviderLocation {
  lat: number
  lng: number
  heading: number | null
  speed: number | null
  recorded_at: string
}

export interface TimelineEvent {
  id: string
  label: string
  status: string
  created_at: string
  actor_type: string | null
  new_status: string | null
}

interface UseRealtimeRequestReturn {
  request: RealtimeRequest | null
  providerLocation: ProviderLocation | null
  timeline: TimelineEvent[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useRealtimeRequest(requestId: string | null): UseRealtimeRequestReturn {
  const [request, setRequest] = useState<RealtimeRequest | null>(null)
  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequest = useCallback(async () => {
    if (!requestId) {
      setIsLoading(false)
      return
    }

    try {
      // Fetch request
      const { data: reqData, error: reqError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (reqError) throw reqError
      setRequest(reqData)

      // Fetch timeline
      const { data: eventsData } = await supabase
        .from('request_events')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })

      setTimeline(eventsData || [])

      // Fetch latest provider location if assigned
      const providerId = reqData?.provider_id || reqData?.technician_id
      if (providerId) {
        const { data: locData } = await supabase
          .from('provider_locations')
          .select('*')
          .eq('provider_id', providerId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single()

        if (locData) {
          setProviderLocation({
            lat: locData.lat,
            lng: locData.lng,
            heading: locData.heading,
            speed: locData.speed,
            recorded_at: locData.recorded_at,
          })
        }
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch request')
    } finally {
      setIsLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    if (!requestId) return

    fetchRequest()

    const channels: RealtimeChannel[] = []

    // Subscribe to request changes
    const requestChannel = supabase
      .channel(`request:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          if (payload.new) {
            setRequest(payload.new as RealtimeRequest)
          }
        }
      )
      .subscribe()

    channels.push(requestChannel)

    // Subscribe to timeline events
    const eventsChannel = supabase
      .channel(`events:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_events',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          if (payload.new) {
            setTimeline((prev) => [...prev, payload.new as TimelineEvent])
          }
        }
      )
      .subscribe()

    channels.push(eventsChannel)

    // Cleanup
    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [requestId, fetchRequest])

  // Subscribe to provider location when provider is assigned
  useEffect(() => {
    const providerId = request?.provider_id || request?.technician_id
    if (!providerId) return

    const locationChannel = supabase
      .channel(`provider-loc:${providerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'provider_locations',
          filter: `provider_id=eq.${providerId}`,
        },
        (payload) => {
          if (payload.new) {
            setProviderLocation({
              lat: payload.new.lat,
              lng: payload.new.lng,
              heading: payload.new.heading,
              speed: payload.new.speed,
              recorded_at: payload.new.recorded_at,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(locationChannel)
    }
  }, [request?.provider_id, request?.technician_id])

  return {
    request,
    providerLocation,
    timeline,
    isLoading,
    error,
    refetch: fetchRequest,
  }
}

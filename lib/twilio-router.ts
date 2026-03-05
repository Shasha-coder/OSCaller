/**
 * OSCaller Twilio Number Router
 * ─── Select the correct Twilio number based on recipient country ───
 *
 * Compliance notes:
 * - US: TCPA requires prior express consent for automated calls. Consent is captured during onboarding.
 * - Canada: CASL requires consent for commercial SMS. Voice calls to existing customers are allowed.
 * - Mexico: RFC registration required for business calls. Numbers must be locally registered.
 *
 * The AI agent always calls from a number matching the recipient's country
 * so the call appears local and trusted.
 */

import { createServerClient } from '@/lib/supabase/server'
import { redis, KEYS } from '@/lib/redis'
import type { SupportedCountry } from '@/lib/supabase/types'

export interface TwilioNumberInfo {
  phone_number: string
  country_code: SupportedCountry
  capabilities: { voice: boolean; sms: boolean }
}

/**
 * Get the best Twilio outbound number for a given country.
 * Uses Redis cache first, falls back to Supabase.
 */
export async function getTwilioNumberForCountry(
  countryCode: SupportedCountry
): Promise<TwilioNumberInfo | null> {
  const cacheKey = KEYS.twilioNumber(countryCode)

  // Try Redis first
  try {
    const cached = await redis.get(cacheKey)
    if (cached && typeof cached === 'string') {
      return JSON.parse(cached) as TwilioNumberInfo
    }
  } catch {
    // Redis unavailable, continue
  }

  // Query Supabase
  const db = createServerClient()
  const { data } = await db
    .from('twilio_numbers' as never)
    .select('phone_number, country_code, capabilities')
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!data) return null

  const result = data as unknown as TwilioNumberInfo

  // Cache for 5 minutes
  try {
    await redis.set(cacheKey, JSON.stringify(result), { ex: 300 })
  } catch {
    // Non-critical
  }

  return result
}

/**
 * Determine which country a phone number belongs to (basic E.164 parsing).
 * Used when the system needs to route an outbound call to the correct Twilio number.
 */
export function detectCountryFromPhone(phoneE164: string): SupportedCountry {
  if (phoneE164.startsWith('+1')) {
    // +1 is shared by US and Canada. 
    // Canadian area codes start with specific prefixes.
    // Common CA prefixes: 204, 226, 236, 249, 250, 289, 306, 343, 365, 
    // 403, 416, 418, 431, 437, 438, 450, 506, 514, 519, 548, 579, 581, 
    // 587, 604, 613, 639, 647, 672, 705, 709, 778, 780, 782, 807, 819, 
    // 825, 867, 873, 902, 905
    const CANADIAN_AREA_CODES = new Set([
      '204', '226', '236', '249', '250', '289', '306', '343', '365',
      '403', '416', '418', '431', '437', '438', '450', '506', '514',
      '519', '548', '579', '581', '587', '604', '613', '639', '647',
      '672', '705', '709', '778', '780', '782', '807', '819', '825',
      '867', '873', '902', '905',
    ])
    const areaCode = phoneE164.slice(2, 5)
    if (CANADIAN_AREA_CODES.has(areaCode)) return 'CA'
    return 'US'
  }
  if (phoneE164.startsWith('+52')) return 'MX'

  // Default to US for unsupported countries (will expand)
  return 'US'
}

/**
 * Get the Twilio number to use for calling a specific phone number.
 * Routes based on the recipient's detected country.
 */
export async function getTwilioNumberForRecipient(
  recipientPhoneE164: string
): Promise<TwilioNumberInfo | null> {
  const country = detectCountryFromPhone(recipientPhoneE164)
  return getTwilioNumberForCountry(country)
}

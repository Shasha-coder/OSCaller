/**
 * Retell Webhook Signature Verification
 * Uses Retell SDK's official verify method for webhook authenticity
 */
import Retell from 'retell-sdk'

export function verifyRetellWebhookSignature(args: {
  rawBody: string
  signature: string | null
  apiKey: string | undefined
}): boolean {
  const { rawBody, signature, apiKey } = args

  // If no API key configured, skip verification (dev mode only)
  // In production, ALWAYS set RETELL_API_KEY
  if (!apiKey) {
    console.warn('[Retell Webhook] No RETELL_API_KEY configured - skipping signature verification')
    return true
  }

  if (!signature) {
    console.error('[Retell Webhook] Missing x-retell-signature header')
    return false
  }

  try {
    // Use Retell SDK's official verification method
    const isValid = Retell.verify(rawBody, apiKey, signature)
    
    if (!isValid) {
      console.error('[Retell Webhook] Signature verification failed')
    }
    
    return isValid
  } catch (error) {
    console.error('[Retell Webhook] Signature verification error:', error)
    return false
  }
}

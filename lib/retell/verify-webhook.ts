/**
 * Retell Webhook Signature Verification
 * Verifies the x-retell-signature header to ensure webhook authenticity
 */
import crypto from 'crypto'

export function verifyRetellWebhookSignature(args: {
  rawBody: string
  signature: string | null
  secret: string | undefined
}): boolean {
  const { rawBody, signature, secret } = args

  // If no secret configured, skip verification (dev mode)
  // In production, ALWAYS set RETELL_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[Retell Webhook] No RETELL_WEBHOOK_SECRET configured - skipping signature verification')
    return true
  }

  if (!signature) {
    console.error('[Retell Webhook] Missing x-retell-signature header')
    return false
  }

  try {
    // Retell uses HMAC SHA-256 for webhook signatures
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch (error) {
    console.error('[Retell Webhook] Signature verification error:', error)
    return false
  }
}

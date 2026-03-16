type StripeCheckoutResponse = {
  clientSecret: string
}

type StripeSessionStatusResponse = {
  status: string
  customer_email?: string | null
  payment_intent?: string | null
  purchase_type?: 'trip' | 'lifetime'
}

async function readStripeJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const expectsJson = contentType.includes('application/json')

  if (!response.ok || !expectsJson) {
    const message = await response.text()
    const looksLikeHtml =
      message.includes('<!DOCTYPE html') || message.includes('<html')
    if (looksLikeHtml) {
      throw new Error('Stripe checkout is not available yet.')
    }
    throw new Error(message || 'Unable to connect to Stripe.')
  }

  return (await response.json()) as T
}

const stripeBaseUrl = '/api/stripe'

export async function createStripeCheckoutSession(options?: {
  email?: string | null
  type?: 'trip' | 'lifetime'
}): Promise<string> {
  const response = await fetch(`${stripeBaseUrl}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: options?.email ?? null,
      type: options?.type ?? 'trip',
    }),
  })

  const data = await readStripeJson<StripeCheckoutResponse>(response)

  if (!data?.clientSecret) {
    throw new Error('Stripe session not available.')
  }

  return data.clientSecret
}

export async function fetchStripeSessionStatus(
  sessionId: string,
): Promise<StripeSessionStatusResponse> {
  const response = await fetch(
    `${stripeBaseUrl}/session-status?session_id=${encodeURIComponent(sessionId)}`,
  )

  return readStripeJson<StripeSessionStatusResponse>(response)
}

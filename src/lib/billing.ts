type StripeSessionResponse = {
  url: string
}

async function createStripeSession(path: string): Promise<string> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Unable to connect to Stripe.')
  }

  const data = (await response.json()) as StripeSessionResponse

  if (!data?.url) {
    throw new Error('Stripe session not available.')
  }

  return data.url
}

export async function createStripePortalSession(): Promise<string> {
  return createStripeSession('/api/stripe/portal')
}

export async function createStripeCheckoutSession(): Promise<string> {
  return createStripeSession('/api/stripe/checkout')
}

import type { H3Event } from 'h3'

export async function mercadoPagoRequest(event: H3Event, path: string, options: RequestInit = {}) {
  const config = useRuntimeConfig(event)
  if (!config.mercadoPagoAccessToken) throw createError({ statusCode: 503, statusMessage: 'Mercado Pago ainda não configurado.' })

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.mercadoPagoAccessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('Mercado Pago error', response.status, data)
    throw createError({ statusCode: 502, statusMessage: 'Falha na comunicação com o Mercado Pago.' })
  }
  return data as any
}

export async function applySubscriptionStatus(event: H3Event, subscription: any) {
  const userId = String(subscription.external_reference || '')
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return false
  const active = subscription.status === 'authorized'
  const supabase = getAdminClient(event)
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    provider: 'mercadopago',
    provider_subscription_id: subscription.id,
    status: subscription.status,
    plan: 'pro',
    amount: subscription.auto_recurring?.transaction_amount || 39.90,
    updated_at: new Date().toISOString()
  }, { onConflict: 'provider,provider_subscription_id' })

  await supabase.from('profiles').update({
    plan: active ? 'pro' : 'free',
    plan_status: subscription.status,
    subscription_id: subscription.id,
    updated_at: new Date().toISOString()
  }).eq('id', userId)
  return true
}

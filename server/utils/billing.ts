import type { H3Event } from 'h3'

export async function mercadoPagoRequest(event: H3Event, path: string, options: RequestInit = {}) {
  const config = useRuntimeConfig(event)
  const accessToken = getRuntimeEnv(event, 'NUXT_MERCADO_PAGO_ACCESS_TOKEN', config.mercadoPagoAccessToken)
  if (!accessToken) throw createError({ statusCode: 503, statusMessage: 'Mercado Pago ainda não configurado.' })

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
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
  const supabase = getAdminClient(event)
  const providerSubscriptionId = String(subscription.id || '')
  if (!providerSubscriptionId) return false

  const { data: storedSubscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('provider', 'mercadopago')
    .eq('provider_subscription_id', providerSubscriptionId)
    .maybeSingle()
  const plan = isPaidPlanId(storedSubscription?.plan)
    ? storedSubscription.plan
    : paidPlanFromAmount(subscription.auto_recurring?.transaction_amount)
  if (!plan) return false

  const { error: subscriptionError } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    provider: 'mercadopago',
    provider_subscription_id: providerSubscriptionId,
    status: subscription.status,
    plan,
    amount: subscription.auto_recurring?.transaction_amount || getPlan(plan).monthlyPrice,
    updated_at: new Date().toISOString()
  }, { onConflict: 'provider,provider_subscription_id' })
  if (subscriptionError) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar a assinatura.' })

  const { data: profile } = await supabase.from('profiles').select('subscription_id').eq('id', userId).single()
  if (profile?.subscription_id && profile.subscription_id !== providerSubscriptionId) return true

  const authorized = subscription.status === 'authorized'
  const { error: profileError } = await supabase.from('profiles').update({
    ...(!authorized ? { plan: 'free' } : {}),
    plan_status: subscription.status,
    subscription_id: providerSubscriptionId,
    updated_at: new Date().toISOString()
  }).eq('id', userId)
  if (profileError) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar o plano da conta.' })
  return true
}

export function isApprovedAuthorizedPayment(payment: any, plan: PaidPlanId) {
  const expectedAmountInCents = Math.round(getPlan(plan).monthlyPrice * 100)
  const paidAmountInCents = Math.round(Number(payment?.transaction_amount || 0) * 100)
  return Boolean(
    payment?.preapproval_id
    && payment?.payment?.status === 'approved'
    && String(payment?.currency_id || '').toUpperCase() === 'BRL'
    && paidAmountInCents === expectedAmountInCents
  )
}

export async function recordAuthorizedPayment(event: H3Event, payment: any) {
  const providerSubscriptionId = String(payment.preapproval_id || '')
  const providerPaymentId = String(payment.id || '')
  if (!providerSubscriptionId || !providerPaymentId) return false

  const supabase = getAdminClient(event)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id,plan,status')
    .eq('provider', 'mercadopago')
    .eq('provider_subscription_id', providerSubscriptionId)
    .maybeSingle()
  if (!subscription?.user_id || !isPaidPlanId(subscription.plan)) return false

  const paymentStatus = String(payment.payment?.status || payment.status || 'unknown')
  const approved = subscription.status === 'authorized' && isApprovedAuthorizedPayment(payment, subscription.plan)

  const { error } = await supabase.from('subscription_payments').upsert({
    user_id: subscription.user_id,
    provider: 'mercadopago',
    provider_payment_id: providerPaymentId,
    provider_subscription_id: providerSubscriptionId,
    status: paymentStatus,
    amount: Number(payment.transaction_amount || 0),
    paid_at: payment.payment?.date_approved || payment.date_approved || null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'provider,provider_payment_id' })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao registrar a cobrança.' })

  if (!approved) return false

  const { data: profile } = await supabase.from('profiles').select('subscription_id').eq('id', subscription.user_id).single()
  if (profile?.subscription_id !== providerSubscriptionId) return false

  const { error: profileError } = await supabase.from('profiles').update({
    plan: subscription.plan,
    plan_status: 'authorized',
    updated_at: new Date().toISOString()
  }).eq('id', subscription.user_id)
  if (profileError) throw createError({ statusCode: 500, statusMessage: 'Erro ao liberar o plano pago.' })
  return true
}

export async function reconcileAuthorizedPayments(event: H3Event, providerSubscriptionId: string) {
  const result = await mercadoPagoRequest(
    event,
    `/authorized_payments/search?preapproval_id=${encodeURIComponent(providerSubscriptionId)}`
  )
  const payments = Array.isArray(result?.results) ? result.results : []
  for (const payment of payments) {
    if (await recordAuthorizedPayment(event, payment)) return true
  }
  return false
}

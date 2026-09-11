import type { H3Event } from 'h3'

export async function mercadoPagoRequest(event: H3Event, path: string, options: RequestInit = {}) {
  const config = useRuntimeConfig(event)
  const accessToken = getRuntimeEnv(event, 'NUXT_MERCADO_PAGO_ACCESS_TOKEN', config.mercadoPagoAccessToken)
  if (!accessToken) throw createError({ statusCode: 503, statusMessage: 'Mercado Pago ainda não configurado.' })
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options, signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('Mercado Pago error', path, response.status, JSON.stringify(data).slice(0, 600))
    throw createError({ statusCode: 502, statusMessage: `Mercado Pago ${response.status}: ${JSON.stringify(data).slice(0, 300)}` })
  }
  return data as any
}
export async function applySubscriptionStatus(event: H3Event, subscription: any) {
  const supabase = getAdminClient(event)
  const id = String(subscription.id || '')
  const { data: stored, error } = await supabase.from('subscriptions')
    .select('*').eq('provider', 'mercadopago').eq('provider_subscription_id', id).maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao consultar assinatura.' })
  if (!stored || stored.user_id !== subscription.external_reference) return false
  const status = stored.status === 'cancelled' ? 'cancelled' : String(subscription.status)
  const { error: updateError } = await supabase.from('subscriptions').update({
    status, updated_at: new Date().toISOString()
  }).eq('id', stored.id)
  if (updateError) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar assinatura.' })
  const { error: profileError } = await supabase.from('profiles').update({
    plan_status: status, updated_at: new Date().toISOString()
  }).eq('id', stored.user_id).eq('subscription_id', id)
  if (profileError) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar a renovação.' })
  // Cancellation changes renewal only. Paid access is determined by payments.
  return true
}

export function isApprovedAuthorizedPayment(payment: any, contract: PaidPlanId | { amount_cents: number }) {
  const expected = typeof contract === 'string' ? Math.round(getPlan(contract).monthlyPrice * 100) : contract.amount_cents
  const amount = Number(payment?.transaction_amount)
  return Boolean(payment?.preapproval_id && payment?.payment?.status === 'approved'
    && payment?.currency_id === 'BRL' && Number.isFinite(amount)
    && Math.abs(amount * 100 - expected) < 0.000001)
}

export async function recordAuthorizedPayment(event: H3Event, invoice: any) {
  const subscriptionId = String(invoice.preapproval_id || '')
  const invoiceId = String(invoice.id || '')
  const paymentId = String(invoice.payment?.id || '')
  if (!subscriptionId || !invoiceId || !paymentId) return false
  const supabase = getAdminClient(event)
  // The actual payment is authoritative for refunds, currency and amount.
  const payment = await mercadoPagoRequest(event, `/v1/payments/${encodeURIComponent(paymentId)}`)
  if (String(payment.id) !== paymentId) return false
  const amount = Number(payment.transaction_amount)
  if (!Number.isFinite(amount) || amount < 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) return false
  const status = Number(payment.transaction_amount_refunded || 0) > 0 ? 'refunded' : String(payment.status || 'unknown')
  const paidAt = payment.date_approved || null
  const { data, error } = await supabase.rpc('record_billing_payment', {
    p_subscription_id: subscriptionId, p_invoice_id: invoiceId, p_payment_id: paymentId,
    p_status: status, p_amount_cents: Math.round(amount * 100), p_currency: String(payment.currency_id || ''),
    p_paid_at: paidAt, p_period_start: invoice.debit_date || paidAt
  })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao registrar a cobrança.' })
  return data === true
}

export async function reconcileAuthorizedPayments(event: H3Event, providerSubscriptionId: string) {
  let active = false
  const result = await mercadoPagoRequest(event,
    `/authorized_payments/search?preapproval_id=${encodeURIComponent(providerSubscriptionId)}`)
  const payments = Array.isArray(result?.results) ? result.results : []
  for (const payment of payments) {
    if (String(payment.preapproval_id) !== providerSubscriptionId) continue
    active = await recordAuthorizedPayment(event, payment) || active
  }
  return active
}

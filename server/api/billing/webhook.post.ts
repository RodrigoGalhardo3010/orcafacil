async function validSignature(signatureHeader: string, requestId: string, dataId: string, secret: string) {
  const parts = Object.fromEntries(signatureHeader.split(',').map(part => part.trim().split('=')))
  if (!parts.ts || !parts.v1 || !requestId || !dataId) return false
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const expected = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
  if (expected.length !== parts.v1.length) return false
  let difference = 0
  for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ parts.v1.charCodeAt(index)
  return difference === 0
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = getQuery(event)
  const config = useRuntimeConfig(event)
  const webhookSecret = getRuntimeEnv(event, 'NUXT_MERCADO_PAGO_WEBHOOK_SECRET', config.mercadoPagoWebhookSecret)
  if (!webhookSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Webhook ainda não configurado.' })
  }
  const dataId = String(query['data.id'] || body?.data?.id || '').toLowerCase()

  try {
    if (!await validSignature(getHeader(event, 'x-signature') || '', getHeader(event, 'x-request-id') || '', dataId, webhookSecret)) {
      throw new Error('Invalid signature')
    }
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Webhook inválido.' })
  }

  const topic = String(body?.type || query.topic || query.type || '')
  if (topic === 'subscription_preapproval' && dataId) {
    const subscription = await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(dataId)}`)
    await applySubscriptionStatus(event, subscription)
    await reconcileAuthorizedPayments(event, String(subscription.id))
  }

  if (topic === 'subscription_authorized_payment' && dataId) {
    const payment = await mercadoPagoRequest(event, `/authorized_payments/${encodeURIComponent(dataId)}`)
    if (payment.preapproval_id) {
      const subscription = await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(payment.preapproval_id)}`)
      await applySubscriptionStatus(event, subscription)
      await recordAuthorizedPayment(event, payment)
    }
  }

  if (topic === 'payment' && dataId) {
    const supabase = getAdminClient(event)
    const { data: invoices, error } = await supabase.from('subscription_payments')
      .select('provider_payment_id').eq('provider', 'mercadopago').eq('mercado_pago_payment_id', dataId)
    if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao consultar cobrança.' })
    for (const invoice of invoices || []) {
      const payment = await mercadoPagoRequest(event, `/authorized_payments/${encodeURIComponent(invoice.provider_payment_id)}`)
      await recordAuthorizedPayment(event, payment)
    }
  }
  return { ok: true }
})

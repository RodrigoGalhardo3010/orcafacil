import { WebhookSignatureValidator } from 'mercadopago'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = getQuery(event)
  const config = useRuntimeConfig(event)
  if (!config.mercadoPagoWebhookSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Webhook ainda não configurado.' })
  }
  const dataId = String(query['data.id'] || body?.data?.id || '')

  if (config.mercadoPagoWebhookSecret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: getHeader(event, 'x-signature') || '',
        xRequestId: getHeader(event, 'x-request-id') || '',
        dataId,
        secret: config.mercadoPagoWebhookSecret
      })
    } catch {
      throw createError({ statusCode: 401, statusMessage: 'Webhook inválido.' })
    }
  }

  const topic = String(body?.type || query.topic || query.type || '')
  if (topic === 'subscription_preapproval' && dataId) {
    const subscription = await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(dataId)}`)
    await applySubscriptionStatus(event, subscription)
  }

  return { ok: true }
})

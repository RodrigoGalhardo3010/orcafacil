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
  if (!config.mercadoPagoWebhookSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Webhook ainda não configurado.' })
  }
  const dataId = String(query['data.id'] || body?.data?.id || '')

  try {
    if (!await validSignature(getHeader(event, 'x-signature') || '', getHeader(event, 'x-request-id') || '', dataId, config.mercadoPagoWebhookSecret)) {
      throw new Error('Invalid signature')
    }
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Webhook inválido.' })
  }

  const topic = String(body?.type || query.topic || query.type || '')
  if (topic === 'subscription_preapproval' && dataId) {
    const subscription = await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(dataId)}`)
    await applySubscriptionStatus(event, subscription)
  }

  return { ok: true }
})

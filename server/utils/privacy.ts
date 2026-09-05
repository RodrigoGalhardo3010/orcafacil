import type { H3Event } from 'h3'

export async function hashRequestIdentity(event: H3Event) {
  const config = useRuntimeConfig(event)
  const secret = config.eventHashSecret
  if (!secret) return null
  const ip = getHeader(event, 'cf-connecting-ip') || getHeader(event, 'x-forwarded-for') || 'unknown'
  const ua = getHeader(event, 'user-agent') || 'unknown'
  const data = new TextEncoder().encode(`${ip}|${ua}`)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

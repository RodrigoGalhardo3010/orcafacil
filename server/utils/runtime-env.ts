import type { H3Event } from 'h3'

type CloudflareEventContext = {
  cloudflare?: {
    env?: Record<string, unknown>
  }
}

export function getRuntimeEnv(event: H3Event, name: string, configuredValue?: unknown) {
  const cloudflareEnv = (event.context as CloudflareEventContext).cloudflare?.env
  const bindingValue = cloudflareEnv?.[name]

  if (typeof bindingValue === 'string' && bindingValue) return bindingValue
  return typeof configuredValue === 'string' ? configuredValue : ''
}

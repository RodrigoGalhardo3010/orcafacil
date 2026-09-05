import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export function getAdminClient(event: H3Event) {
  const config = useRuntimeConfig(event)
  if (!config.public.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado.' })
  }

  return createClient(config.public.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

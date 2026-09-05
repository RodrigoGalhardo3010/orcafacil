import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export function getAdminClient(event: H3Event) {
  const config = useRuntimeConfig(event)
  const supabaseUrl = getRuntimeEnv(event, 'NUXT_PUBLIC_SUPABASE_URL', config.public.supabaseUrl)
  const serviceRoleKey = getRuntimeEnv(event, 'NUXT_SUPABASE_SERVICE_ROLE_KEY', config.supabaseServiceRoleKey)

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado.' })
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

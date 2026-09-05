import type { SupabaseClient } from '@supabase/supabase-js'

export function useSupabase(): SupabaseClient {
  return useNuxtApp().$supabase as SupabaseClient
}

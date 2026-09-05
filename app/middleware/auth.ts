export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const supabase = useSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return navigateTo('/login')
  }
})

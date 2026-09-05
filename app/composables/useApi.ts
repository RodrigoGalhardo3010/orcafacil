export function useApi() {
  const supabase = useSupabase()

  async function request<T>(url: string, options: Record<string, any> = {}): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Sessão expirada. Entre novamente.')
    }

    const headers = new Headers(options.headers || {})
    headers.set('Authorization', `Bearer ${session.access_token}`)

    return await $fetch(url, {
      ...options,
      headers
    }) as T
  }

  return { request }
}

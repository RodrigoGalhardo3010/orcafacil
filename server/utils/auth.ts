import type { H3Event } from 'h3'

export async function requireUser(event: H3Event) {
  const authorization = getHeader(event, 'authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Não autenticado.' })

  const supabase = getAdminClient(event)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw createError({ statusCode: 401, statusMessage: 'Sessão inválida ou expirada.' })
  return data.user
}

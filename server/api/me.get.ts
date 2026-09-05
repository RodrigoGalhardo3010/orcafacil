export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = getAdminClient(event)
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao carregar perfil.' })

  const start = new Date()
  start.setUTCDate(1)
  start.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('sent_at', start.toISOString())

  return {
    profile,
    usage: {
      sentThisMonth: count || 0,
      limit: profile?.plan === 'pro' ? null : 3
    },
    email: user.email
  }
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const query = getQuery(event)
  const supabase = getAdminClient(event)

  const select = 'id,number,client_name,title,status,total,created_at,sent_at,updated_at'
  let builder = supabase.from('proposals').select(select).eq('user_id', user.id)

  if (query.status) {
    const statuses = String(query.status).split(',').map(s => s.trim()).filter(Boolean)
    if (statuses.length === 1) builder = builder.eq('status', statuses[0])
    else if (statuses.length > 1) builder = builder.in('status', statuses)
  }
  if (query.client) {
    builder = builder.ilike('client_name', `%${String(query.client)}%`)
  }
  if (query.from) {
    builder = builder.gte('created_at', String(query.from))
  }
  if (query.to) {
    builder = builder.lte('created_at', String(query.to))
  }

  builder = builder.order('created_at', { ascending: false })
  const { data, error } = await builder
  if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao carregar propostas.' })
  return { proposals: data || [] }
})

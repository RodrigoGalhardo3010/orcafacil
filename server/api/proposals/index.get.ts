export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = getAdminClient(event)
  const { data, error } = await supabase.from('proposals').select('id,number,client_name,title,status,total,created_at').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao listar propostas.' })
  return { proposals: data || [] }
})

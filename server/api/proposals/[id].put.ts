export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  await getProposalForOwner(event, id, user.id)
  const body = await readBody(event)
  const cleaned = cleanProposalBody(body)
  const supabase = getAdminClient(event)

  const { data: proposal, error } = await supabase.from('proposals').update({ ...cleaned.proposal, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select('*').single()
  if (error || !proposal) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar proposta.' })

  await supabase.from('proposal_items').delete().eq('proposal_id', id)
  const { error: itemsError } = await supabase.from('proposal_items').insert(cleaned.items.map(item => ({ proposal_id: id, ...item })))
  if (itemsError) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar itens.' })

  return { proposal: { ...proposal, items: cleaned.items } }
})

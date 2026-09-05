export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const cleaned = cleanProposalBody(body)
  const supabase = getAdminClient(event)

  const { data: proposal, error } = await supabase.from('proposals').insert({ user_id: user.id, ...cleaned.proposal }).select('*').single()
  if (error || !proposal) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar proposta.' })

  const { error: itemsError } = await supabase.from('proposal_items').insert(cleaned.items.map(item => ({ proposal_id: proposal.id, ...item })))
  if (itemsError) {
    await supabase.from('proposals').delete().eq('id', proposal.id)
    throw createError({ statusCode: 500, statusMessage: 'Erro ao salvar itens.' })
  }
  return { proposal }
})

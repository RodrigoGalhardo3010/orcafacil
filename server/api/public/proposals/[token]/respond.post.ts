export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') || ''
  const body = await readBody(event)
  const decision = body?.decision === 'accepted' ? 'accepted' : body?.decision === 'rejected' ? 'rejected' : null
  const name = String(body?.name || '').trim()
  const email = String(body?.email || '').trim() || null
  if (!decision) throw createError({ statusCode: 400, statusMessage: 'Resposta inválida.' })
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Informe seu nome.' })

  const supabase = getAdminClient(event)
  const { data: proposal, error } = await supabase.from('proposals').select('*').eq('public_token', token).single()
  if (error || !proposal || proposal.status === 'draft') throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada.' })
  if (['accepted', 'rejected'].includes(proposal.status)) return { ok: true, status: proposal.status }

  const now = new Date().toISOString()
  const identityHash = await hashRequestIdentity(event)
  const patch: any = { status: decision, responded_by_name: name, responded_by_email: email, updated_at: now }
  if (decision === 'accepted') patch.accepted_at = now
  else patch.rejected_at = now
  await supabase.from('proposals').update(patch).eq('id', proposal.id)
  await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: decision, metadata: { name, email, identity_hash: identityHash } })

  try {
    const { data: owner } = await supabase.auth.admin.getUserById(proposal.user_id)
    if (owner.user?.email) await sendOwnerResponseEmail(event, owner.user.email, proposal.client_name, proposal.title, decision)
  } catch (error) {
    console.error('Owner notification error', error)
  }
  return { ok: true, status: decision }
})

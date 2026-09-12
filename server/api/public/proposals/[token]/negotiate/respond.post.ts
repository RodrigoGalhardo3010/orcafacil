export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') || ''
  const body = await readBody(event)
  const decision = body?.decision === 'accept' ? 'accept' : body?.decision === 'reject' ? 'reject' : null
  const name = String(body?.name || '').trim()
  const email = String(body?.email || '').trim() || null
  if (!decision) throw createError({ statusCode: 400, statusMessage: 'Resposta inválida.' })
  if (decision === 'accept' && !name) throw createError({ statusCode: 400, statusMessage: 'Informe seu nome.' })

  const supabase = getAdminClient(event)
  const { data: proposal, error } = await supabase.from('proposals').select('*').eq('public_token', token).neq('status', 'draft').single()
  if (error || !proposal) throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada.' })

  const rounds = await getProposalRounds(supabase, proposal.id)
  const open = openRound(rounds)
  if (!open || open.actor !== 'seller' || open.kind !== 'counter') {
    throw createError({ statusCode: 409, statusMessage: 'Não há contraproposta aguardando sua resposta.' })
  }

  const now = new Date().toISOString()
  const seq = nextRoundSeq(rounds)
  const identityHash = await hashRequestIdentity(event)

  if (decision === 'accept') {
    await supabase.from('proposal_negotiation_rounds').update({ status: 'accepted' }).eq('id', open.id)
    await supabase.from('proposal_negotiation_rounds').insert({ proposal_id: proposal.id, seq, actor: 'buyer', kind: 'accept', total: open.total, payment_terms: open.payment_terms, status: 'accepted', created_at: now })
    await supabase.from('proposals').update({ status: 'accepted', responded_by_name: name, responded_by_email: email, accepted_at: now, updated_at: now }).eq('id', proposal.id)
    await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'accepted', metadata: { name, email, identity_hash: identityHash, negotiated: true } })

    try {
      const { data: owner } = await supabase.auth.admin.getUserById(proposal.user_id)
      if (owner.user?.email) await sendOwnerResponseEmail(event, owner.user.email, proposal.client_name, proposal.title, 'accepted')
    } catch (error) {
      console.error('Owner notification error', error)
    }
    return { ok: true, status: 'accepted' }
  }

  // Reject da contraproposta: volta ao valor original.
  const patch: any = { status: 'sent', updated_at: now }
  if (proposal.original_total != null) {
    patch.total = proposal.original_total
    patch.discount = proposal.original_discount ?? 0
    patch.payment_terms = proposal.original_payment_terms
  }
  await supabase.from('proposal_negotiation_rounds').update({ status: 'rejected' }).eq('id', open.id)
  await supabase.from('proposal_negotiation_rounds').insert({ proposal_id: proposal.id, seq, actor: 'buyer', kind: 'reject', status: 'rejected', created_at: now })
  await supabase.from('proposals').update(patch).eq('id', proposal.id)
  await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'negotiation_counter_rejected', metadata: { name: name || null, email, identity_hash: identityHash } })

  return { ok: true, status: 'sent' }
})

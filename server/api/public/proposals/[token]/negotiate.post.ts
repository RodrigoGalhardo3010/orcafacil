export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') || ''
  const body = await readBody(event)
  const requestedTotal = Number(body?.requested_total)
  const requestedPaymentTerms = String(body?.requested_payment_terms || '').trim() || null
  const message = String(body?.message || '').trim() || null

  const supabase = getAdminClient(event)
  const { data: proposal, error } = await supabase.from('proposals').select('*').eq('public_token', token).neq('status', 'draft').single()
  if (error || !proposal) throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada.' })
  if (proposal.status !== 'sent') throw createError({ statusCode: 409, statusMessage: 'Esta proposta não aceita uma nova solicitação de desconto neste momento.' })
  if (!Number.isFinite(requestedTotal) || requestedTotal <= 0) throw createError({ statusCode: 400, statusMessage: 'Informe um valor válido para a negociação.' })
  if (requestedTotal > Number(proposal.total)) throw createError({ statusCode: 400, statusMessage: 'O valor solicitado deve ser menor ou igual ao valor atual da proposta.' })

  const rounds = await getProposalRounds(supabase, proposal.id)
  // Guarda o valor original (baseline) na primeira solicitação.
  if (proposal.original_total == null) {
    await supabase.from('proposals').update({
      original_total: proposal.total,
      original_discount: proposal.discount,
      original_payment_terms: proposal.payment_terms
    }).eq('id', proposal.id)
  }

  const now = new Date().toISOString()
  const { error: roundError } = await supabase.from('proposal_negotiation_rounds').insert({
    proposal_id: proposal.id, seq: nextRoundSeq(rounds), actor: 'buyer', kind: 'request',
    total: requestedTotal, payment_terms: requestedPaymentTerms, message, status: 'open', created_at: now
  })
  if (roundError) throw createError({ statusCode: 500, statusMessage: 'Erro ao registrar a solicitação.' })

  await supabase.from('proposals').update({ status: 'negotiating', updated_at: now }).eq('id', proposal.id)
  const identityHash = await hashRequestIdentity(event)
  await supabase.from('proposal_events').insert({
    proposal_id: proposal.id, event_type: 'negotiation_requested',
    metadata: { requested_total: requestedTotal, requested_payment_terms: requestedPaymentTerms, identity_hash: identityHash }
  })

  return { ok: true, status: 'negotiating' }
})

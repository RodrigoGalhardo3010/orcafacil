export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  const decision = body?.decision
  const supabase = getAdminClient(event)
  const { proposal, items } = await getProposalForOwner(event, id, user.id)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const rounds = await getProposalRounds(supabase, proposal.id)
  const open = openRound(rounds)
  if (!open || open.actor !== 'buyer' || open.kind !== 'request') {
    throw createError({ statusCode: 409, statusMessage: 'Não há solicitação do cliente aguardando sua resposta.' })
  }

  const now = new Date().toISOString()
  const subtotal = Number(proposal.subtotal)
  const seq = nextRoundSeq(rounds)

  if (decision === 'reject') {
    await supabase.from('proposal_negotiation_rounds').update({ status: 'rejected' }).eq('id', open.id)
    await supabase.from('proposal_negotiation_rounds').insert({ proposal_id: proposal.id, seq, actor: 'seller', kind: 'reject', status: 'rejected', created_at: now })
    await supabase.from('proposals').update({ status: 'sent', updated_at: now }).eq('id', proposal.id)
    await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'negotiation_rejected', metadata: { round_id: open.id } })
    return { ok: true, status: 'sent' }
  }

  if (decision === 'accept') {
    const newTotal = Number(open.total)
    const discount = Math.max(0, roundMoney(subtotal - newTotal))
    const { data: updated, error } = await supabase.from('proposals')
      .update({ status: 'sent', discount, total: newTotal, payment_terms: open.payment_terms ?? proposal.payment_terms, updated_at: now })
      .eq('id', proposal.id).select('*').single()
    if (error || !updated) throw createError({ statusCode: 500, statusMessage: 'Erro ao aplicar o desconto.' })
    await supabase.from('proposal_negotiation_rounds').update({ status: 'accepted' }).eq('id', open.id)
    await supabase.from('proposal_negotiation_rounds').insert({ proposal_id: proposal.id, seq, actor: 'seller', kind: 'accept', total: newTotal, payment_terms: open.payment_terms, status: 'accepted', created_at: now })
    await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'negotiation_accepted', metadata: { round_id: open.id, total: newTotal } })
    const { emailSent, emailStatus, publicUrl } = await deliverProposalEmail(event, updated, items, profile)
    return { ok: true, proposal: updated, publicUrl, emailSent, emailStatus }
  }

  if (decision === 'counter') {
    const counterTotal = Number(body?.counter_total)
    const counterTerms = String(body?.counter_payment_terms || '').trim() || null
    if (!Number.isFinite(counterTotal) || counterTotal <= 0 || counterTotal > subtotal) {
      throw createError({ statusCode: 400, statusMessage: 'Informe um valor válido para a contraproposta.' })
    }
    const discount = Math.max(0, roundMoney(subtotal - counterTotal))
    const { data: updated, error } = await supabase.from('proposals')
      .update({ status: 'negotiating', discount, total: counterTotal, payment_terms: counterTerms ?? proposal.payment_terms, updated_at: now })
      .eq('id', proposal.id).select('*').single()
    if (error || !updated) throw createError({ statusCode: 500, statusMessage: 'Erro ao registrar a contraproposta.' })
    await supabase.from('proposal_negotiation_rounds').update({ status: 'superseded' }).eq('id', open.id)
    await supabase.from('proposal_negotiation_rounds').insert({ proposal_id: proposal.id, seq, actor: 'seller', kind: 'counter', total: counterTotal, payment_terms: counterTerms, status: 'open', created_at: now })
    await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'negotiation_countered', metadata: { round_id: open.id, total: counterTotal } })
    const { emailSent, emailStatus, publicUrl } = await deliverProposalEmail(event, updated, items, profile)
    return { ok: true, proposal: updated, publicUrl, emailSent, emailStatus }
  }

  throw createError({ statusCode: 400, statusMessage: 'Decisão inválida.' })
})

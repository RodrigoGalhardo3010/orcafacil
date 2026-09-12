export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  const decision = body?.decision
  const supabase = getAdminClient(event)
  const { proposal, items } = await getProposalForOwner(event, id, user.id)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: negotiation } = await supabase.from('proposal_negotiations')
    .select('*').eq('proposal_id', proposal.id).eq('status', 'open')
    .order('created_at', { ascending: false }).limit(1).single()
  if (!negotiation) throw createError({ statusCode: 404, statusMessage: 'Nenhuma solicitação de desconto em aberto.' })

  const now = new Date().toISOString()
  const subtotal = Number(proposal.subtotal)
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

  if (decision === 'reject') {
    await supabase.from('proposals').update({ status: 'sent', updated_at: now }).eq('id', proposal.id)
    await supabase.from('proposal_negotiations').update({ status: 'rejected', updated_at: now }).eq('id', negotiation.id)
    await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'negotiation_rejected', metadata: { negotiation_id: negotiation.id } })
    return { ok: true, status: 'sent' }
  }

  if (decision === 'accept') {
    const newTotal = Number(negotiation.requested_total)
    const discount = Math.max(0, round(subtotal - newTotal))
    const { data: updated, error } = await supabase.from('proposals')
      .update({ status: 'sent', discount, total: newTotal, payment_terms: negotiation.requested_payment_terms ?? proposal.payment_terms, updated_at: now })
      .eq('id', proposal.id).select('*').single()
    if (error || !updated) throw createError({ statusCode: 500, statusMessage: 'Erro ao aplicar o desconto.' })
    await supabase.from('proposal_negotiations').update({ status: 'accepted', responded_total: newTotal, responded_payment_terms: negotiation.requested_payment_terms, updated_at: now }).eq('id', negotiation.id)
    await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'negotiation_accepted', metadata: { negotiation_id: negotiation.id, total: newTotal } })
    const { emailSent, emailStatus, publicUrl } = await deliverProposalEmail(event, updated, items, profile)
    return { ok: true, proposal: updated, publicUrl, emailSent, emailStatus }
  }

  if (decision === 'counter') {
    const counterTotal = Number(body?.counter_total)
    const counterTerms = String(body?.counter_payment_terms || '').trim() || null
    if (!Number.isFinite(counterTotal) || counterTotal <= 0) throw createError({ statusCode: 400, statusMessage: 'Informe o valor da contraproposta.' })
    const discount = Math.max(0, round(subtotal - counterTotal))

    const { data: newProposal, error: newProposalError } = await supabase.from('proposals').insert({
      user_id: proposal.user_id,
      client_name: proposal.client_name,
      client_email: proposal.client_email,
      client_phone: proposal.client_phone,
      title: proposal.title,
      introduction: proposal.introduction,
      valid_until: proposal.valid_until,
      notes: proposal.notes,
      payment_terms: counterTerms ?? proposal.payment_terms,
      currency: proposal.currency,
      subtotal: subtotal,
      discount,
      total: counterTotal,
      status: 'sent',
      sent_at: now
    }).select('*').single()
    if (newProposalError || !newProposal) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar a contraproposta.' })

    const { error: itemsError } = await supabase.from('proposal_items').insert(
      items.map((item, index) => ({ proposal_id: newProposal.id, description: item.description, quantity: item.quantity, unit_price: item.unit_price, sort_order: index }))
    )
    if (itemsError) {
      await supabase.from('proposals').delete().eq('id', newProposal.id)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao salvar itens da contraproposta.' })
    }

    await supabase.from('proposals').update({ status: 'renegociada', updated_at: now }).eq('id', proposal.id)
    await supabase.from('proposal_negotiations').update({ status: 'countered', responded_total: counterTotal, responded_payment_terms: counterTerms, new_proposal_id: newProposal.id, updated_at: now }).eq('id', negotiation.id)
    await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'negotiation_countered', metadata: { negotiation_id: negotiation.id, new_proposal_id: newProposal.id } })

    const { data: newItems } = await supabase.from('proposal_items').select('*').eq('proposal_id', newProposal.id).order('sort_order')
    const { emailSent, emailStatus, publicUrl } = await deliverProposalEmail(event, newProposal, newItems || [], profile)
    return { ok: true, proposal: newProposal, publicUrl, emailSent, emailStatus }
  }

  throw createError({ statusCode: 400, statusMessage: 'Decisão inválida.' })
})

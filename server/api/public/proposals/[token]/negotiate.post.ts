export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') || ''
  const body = await readBody(event)
  const requestedTotal = Number(body?.requested_total)
  const requestedPaymentTerms = String(body?.requested_payment_terms || '').trim() || null
  const message = String(body?.message || '').trim() || null
  if (!Number.isFinite(requestedTotal) || requestedTotal <= 0) throw createError({ statusCode: 400, statusMessage: 'Informe um valor válido para a negociação.' })

  const supabase = getAdminClient(event)
  const { data: proposal, error } = await supabase.from('proposals').select('*').eq('public_token', token).neq('status', 'draft').single()
  if (error || !proposal) throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada.' })
  if (proposal.status === 'negotiating') throw createError({ statusCode: 409, statusMessage: 'Já existe uma solicitação de desconto em análise.' })
  if (['accepted', 'rejected', 'expired', 'renegociada'].includes(proposal.status)) throw createError({ statusCode: 409, statusMessage: 'Esta proposta não aceita mais negociação.' })

  const identityHash = await hashRequestIdentity(event)
  const now = new Date().toISOString()

  const { error: negError } = await supabase.from('proposal_negotiations').insert({
    proposal_id: proposal.id, requested_total: requestedTotal, requested_payment_terms: requestedPaymentTerms, message
  })
  if (negError) throw createError({ statusCode: 500, statusMessage: 'Erro ao registrar a solicitação.' })

  await supabase.from('proposals').update({ status: 'negotiating', updated_at: now }).eq('id', proposal.id)
  await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'negotiation_requested', metadata: { requested_total: requestedTotal, requested_payment_terms: requestedPaymentTerms, identity_hash: identityHash } })

  return { ok: true }
})

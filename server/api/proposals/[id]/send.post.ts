export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const supabase = getAdminClient(event)
  const { proposal, items } = await getProposalForOwner(event, id, user.id)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const plan = getPlan(effectivePlan(profile))
  if (plan.monthlyProposalLimit !== null && !proposal.sent_at) {
    const start = new Date()
    start.setUTCDate(1)
    start.setUTCHours(0, 0, 0, 0)
    const { count } = await supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('sent_at', start.toISOString())
    if ((count || 0) >= plan.monthlyProposalLimit) {
      throw createError({
        statusCode: 402,
        statusMessage: `Você atingiu o limite de ${plan.monthlyProposalLimit} propostas do plano ${plan.name} neste mês. Escolha um plano com mais envios para continuar.`
      })
    }
  }

  const now = new Date().toISOString()
  const { data: updated, error } = await supabase.from('proposals').update({ status: 'sent', sent_at: proposal.sent_at || now, updated_at: now }).eq('id', proposal.id).select('*').single()
  if (error || !updated) throw createError({ statusCode: 500, statusMessage: 'Erro ao liberar proposta.' })
  await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'sent', metadata: { channel: proposal.client_email ? 'email_pdf_and_link' : 'pdf_and_link' } })

  const { emailSent, emailStatus, publicUrl } = await deliverProposalEmail(event, updated, items, profile)
  const pdfUrl = `${useRuntimeConfig(event).public.siteUrl}/api/public/proposals/${proposal.public_token}/pdf`
  return { proposal: updated, publicUrl, pdfUrl, emailSent, emailStatus }
})

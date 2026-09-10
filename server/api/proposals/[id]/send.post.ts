export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const supabase = getAdminClient(event)
  const { proposal, items } = await getProposalForOwner(event, id, user.id)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const plan = getPlan(profile?.plan)
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

  const config = useRuntimeConfig(event)
  const publicUrl = `${config.public.siteUrl}/p/${proposal.public_token}`
  const pdfUrl = `${config.public.siteUrl}/api/public/proposals/${proposal.public_token}/pdf`
  let emailSent = false
  let emailStatus = proposal.client_email ? 'failed' : 'not_requested'
  if (proposal.client_email) {
    try {
      const pdfFilename = proposalPdfFilename(proposal.number)
      const pdf = await createProposalPdf({
        companyName: profile?.company_name || 'Proposta comercial',
        number: proposal.number,
        clientName: proposal.client_name,
        title: proposal.title,
        introduction: proposal.introduction,
        validUntil: proposal.valid_until,
        paymentTerms: proposal.payment_terms,
        notes: proposal.notes,
        subtotal: proposal.subtotal,
        discount: proposal.discount,
        total: proposal.total,
        items,
        publicUrl
      })
      const result = await sendProposalEmail(event, proposal.client_email, profile?.company_name || 'Uma empresa', proposal.client_name, proposal.title, publicUrl, pdf, pdfFilename)
      emailSent = result.sent
      emailStatus = result.sent ? 'sent' : (result.reason || 'failed')
    } catch (error) {
      console.error('Email error', error)
    }
  }
  return { proposal: updated, publicUrl, pdfUrl, emailSent, emailStatus }
})

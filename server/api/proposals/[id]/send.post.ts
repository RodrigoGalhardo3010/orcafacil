export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const supabase = getAdminClient(event)
  const { proposal } = await getProposalForOwner(event, id, user.id)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.plan !== 'pro' && !proposal.sent_at) {
    const start = new Date()
    start.setUTCDate(1)
    start.setUTCHours(0, 0, 0, 0)
    const { count } = await supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('sent_at', start.toISOString())
    if ((count || 0) >= 3) throw createError({ statusCode: 402, statusMessage: 'Você atingiu o limite de 3 propostas enviadas neste mês. Assine o plano Pro para continuar.' })
  }

  const now = new Date().toISOString()
  const { data: updated, error } = await supabase.from('proposals').update({ status: 'sent', sent_at: proposal.sent_at || now, updated_at: now }).eq('id', proposal.id).select('*').single()
  if (error || !updated) throw createError({ statusCode: 500, statusMessage: 'Erro ao liberar proposta.' })
  await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'sent', metadata: { channel: proposal.client_email ? 'email_and_link' : 'link' } })

  const config = useRuntimeConfig(event)
  const publicUrl = `${config.public.siteUrl}/p/${proposal.public_token}`
  let emailSent = false
  if (proposal.client_email) {
    try {
      const result = await sendProposalEmail(event, proposal.client_email, profile?.company_name || 'Uma empresa', proposal.client_name, proposal.title, publicUrl)
      emailSent = result.sent
    } catch (error) {
      console.error('Email error', error)
    }
  }
  return { proposal: updated, publicUrl, emailSent }
})

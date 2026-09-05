export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') || ''
  const supabase = getAdminClient(event)
  const { data: proposal, error } = await supabase.from('proposals').select('*').eq('public_token', token).neq('status', 'draft').single()
  if (error || !proposal) throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada.' })

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase.from('proposal_items').select('description,quantity,unit_price,sort_order').eq('proposal_id', proposal.id).order('sort_order'),
    supabase.from('profiles').select('company_name,logo_url,plan').eq('id', proposal.user_id).single()
  ])

  return {
    proposal: {
      number: proposal.number,
      client_name: proposal.client_name,
      title: proposal.title,
      introduction: proposal.introduction,
      valid_until: proposal.valid_until,
      payment_terms: proposal.payment_terms,
      notes: proposal.notes,
      subtotal: proposal.subtotal,
      discount: proposal.discount,
      total: proposal.total,
      currency: proposal.currency,
      status: proposal.status,
      company_name: profile?.company_name || 'Proposta comercial',
      logo_url: profile?.logo_url || null,
      branded: profile?.plan !== 'pro',
      items: items || []
    }
  }
})

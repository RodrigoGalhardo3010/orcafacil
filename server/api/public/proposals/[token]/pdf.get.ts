export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') || ''
  const supabase = getAdminClient(event)
  const { data: proposal, error } = await supabase.from('proposals').select('*').eq('public_token', token).neq('status', 'draft').single()
  if (error || !proposal) throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada.' })

  const [{ data: items, error: itemsError }, { data: profile }] = await Promise.all([
    supabase.from('proposal_items').select('description,quantity,unit_price,sort_order').eq('proposal_id', proposal.id).order('sort_order'),
    supabase.from('profiles').select('company_name').eq('id', proposal.user_id).single()
  ])
  if (itemsError) throw createError({ statusCode: 500, statusMessage: 'Não foi possível preparar o PDF.' })

  const config = useRuntimeConfig(event)
  const publicUrl = `${config.public.siteUrl}/p/${proposal.public_token}`
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
    items: items || [],
    publicUrl
  })

  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${proposalPdfFilename(proposal.number)}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff'
  })
  return pdf
})

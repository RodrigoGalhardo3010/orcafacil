export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const supabase = getAdminClient(event)
  const { proposal, items } = await getProposalForOwner(event, id, user.id)
  const config = useRuntimeConfig(event)

  const { data: negotiations } = await supabase.from('proposal_negotiations')
    .select('*').eq('proposal_id', proposal.id).order('created_at', { ascending: false })

  return {
    proposal: { ...proposal, items },
    negotiations: negotiations || [],
    publicUrl: `${config.public.siteUrl}/p/${proposal.public_token}`,
    pdfUrl: `${config.public.siteUrl}/api/public/proposals/${proposal.public_token}/pdf`
  }
})

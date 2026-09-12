export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const supabase = getAdminClient(event)
  const { proposal, items } = await getProposalForOwner(event, id, user.id)
  const config = useRuntimeConfig(event)

  const rounds = await getProposalRounds(supabase, proposal.id)

  return {
    proposal: { ...proposal, items },
    rounds,
    publicUrl: `${config.public.siteUrl}/p/${proposal.public_token}`,
    pdfUrl: `${config.public.siteUrl}/api/public/proposals/${proposal.public_token}/pdf`
  }
})

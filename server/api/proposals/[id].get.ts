export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const { proposal, items } = await getProposalForOwner(event, id, user.id)
  const config = useRuntimeConfig(event)
  return {
    proposal: { ...proposal, items },
    publicUrl: `${config.public.siteUrl}/p/${proposal.public_token}`,
    pdfUrl: `${config.public.siteUrl}/api/public/proposals/${proposal.public_token}/pdf`
  }
})

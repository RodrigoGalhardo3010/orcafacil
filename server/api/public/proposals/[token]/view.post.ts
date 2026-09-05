export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') || ''
  const supabase = getAdminClient(event)
  const { data: proposal } = await supabase.from('proposals').select('id,status,viewed_at').eq('public_token', token).single()
  if (!proposal || proposal.status === 'draft') return { ok: true }
  const identityHash = await hashRequestIdentity(event)
  if (!proposal.viewed_at) await supabase.from('proposals').update({ viewed_at: new Date().toISOString() }).eq('id', proposal.id)
  await supabase.from('proposal_events').insert({ proposal_id: proposal.id, event_type: 'viewed', metadata: { identity_hash: identityHash } })
  return { ok: true }
})

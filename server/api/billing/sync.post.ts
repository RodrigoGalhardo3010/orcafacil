export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = getAdminClient(event)
  const { data: profile } = await supabase.from('profiles').select('subscription_id').eq('id', user.id).single()
  if (!profile?.subscription_id) return { ok: true, status: 'none' }
  const subscription = await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(profile.subscription_id)}`)
  await applySubscriptionStatus(event, subscription)
  return { ok: true, status: subscription.status }
})

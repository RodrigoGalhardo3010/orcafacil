export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = getAdminClient(event)
  const { data: profile } = await supabase.from('profiles').select('subscription_id,plan_status').eq('id', user.id).single()
  if (!profile?.subscription_id || profile.plan_status !== 'authorized') {
    throw createError({ statusCode: 409, statusMessage: 'Não há uma assinatura ativa para cancelar.' })
  }

  const subscription = await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(profile.subscription_id)}`, {
    method: 'PUT', body: JSON.stringify({ status: 'cancelled' })
  })
  await applySubscriptionStatus(event, { ...subscription, external_reference: user.id })
  return { ok: true, status: subscription.status }
})

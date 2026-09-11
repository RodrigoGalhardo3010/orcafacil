export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = getAdminClient(event)
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao carregar perfil.' })

  const start = new Date()
  start.setUTCDate(1)
  start.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('sent_at', start.toISOString())
  const plan = getPlan(effectivePlan(profile))
  const { data: subscription } = profile?.subscription_id
    ? await supabase.from('subscriptions').select('billing_cycle,amount_cents,current_period_end,status')
      .eq('user_id', user.id).eq('provider', 'mercadopago').eq('provider_subscription_id', profile.subscription_id).maybeSingle()
    : { data: null }

  return {
    profile: { ...profile, plan: plan.id },
    subscription,
    usage: {
      sentThisMonth: count || 0,
      limit: plan.monthlyProposalLimit,
      remaining: plan.monthlyProposalLimit === null ? null : Math.max(0, plan.monthlyProposalLimit - (count || 0))
    },
    email: user.email
  }
})

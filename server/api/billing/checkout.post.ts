export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if (!user.email) throw createError({ statusCode: 400, statusMessage: 'Sua conta precisa ter um e-mail válido.' })
  const body = await readBody(event)
  const planId = body?.plan
  if (!isPaidPlanId(planId)) throw createError({ statusCode: 400, statusMessage: 'Escolha um plano válido.' })

  const config = useRuntimeConfig(event)
  const siteUrl = getRuntimeEnv(event, 'NUXT_PUBLIC_SITE_URL', config.public.siteUrl).replace(/\/$/, '')
  const payerEmailOverride = String(getRuntimeEnv(event, 'NUXT_MERCADO_PAGO_PAYER_EMAIL_OVERRIDE', config.mercadoPagoPayerEmailOverride) || '').trim()
  const isNonProductionSite = /^https?:\/\/localhost(?::\d+)?(?:\/|$)/i.test(siteUrl) || /^https?:\/\/[^/]*[.-]staging(?:[.-]|\/|$)/i.test(siteUrl)
  if (payerEmailOverride && (!isNonProductionSite || !/@testuser\.com$/i.test(payerEmailOverride))) {
    throw createError({ statusCode: 503, statusMessage: 'O comprador de teste do Mercado Pago está configurado de forma inválida.' })
  }
  const payerEmail = payerEmailOverride || user.email
  const plan = getPlan(planId)
  const supabase = getAdminClient(event)
  const { data: profile } = await supabase.from('profiles').select('subscription_id,plan,plan_status').eq('id', user.id).single()
  const { data: storedSubscription } = profile?.subscription_id
    ? await supabase.from('subscriptions').select('plan').eq('provider', 'mercadopago').eq('provider_subscription_id', profile.subscription_id).maybeSingle()
    : { data: null }

  if (profile?.subscription_id) {
    const current = await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(profile.subscription_id)}`)
    if (current.status === 'authorized') {
      if (profile.plan === planId) throw createError({ statusCode: 409, statusMessage: `Seu plano ${plan.name} já está ativo.` })

      const updated = await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(profile.subscription_id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          reason: `OrçaFácil ${plan.name}`,
          auto_recurring: { transaction_amount: plan.monthlyPrice, currency_id: 'BRL' }
        })
      })
      await supabase.from('subscriptions').update({ plan: planId, amount: plan.monthlyPrice, updated_at: new Date().toISOString() })
        .eq('provider', 'mercadopago').eq('provider_subscription_id', profile.subscription_id)
      await applySubscriptionStatus(event, { ...updated, external_reference: user.id })
      return { status: 'updated', plan: planId }
    }

    if (current.status === 'pending' && storedSubscription?.plan === planId && current.init_point) {
      return { checkoutUrl: current.init_point, subscriptionId: current.id, status: 'pending' }
    }

    if (current.status === 'pending' || current.status === 'paused') {
      await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(profile.subscription_id)}`, {
        method: 'PUT', body: JSON.stringify({ status: 'cancelled' })
      })
    }
  }

  const subscription = await mercadoPagoRequest(event, '/preapproval', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({
      reason: `OrçaFácil ${plan.name}`,
      external_reference: user.id,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plan.monthlyPrice,
        currency_id: 'BRL'
      },
      back_url: `${siteUrl}/dashboard/billing-return`,
      status: 'pending'
    })
  })

  await supabase.from('subscriptions').upsert({ user_id: user.id, provider: 'mercadopago', provider_subscription_id: subscription.id, status: subscription.status, plan: planId, amount: plan.monthlyPrice, updated_at: new Date().toISOString() }, { onConflict: 'provider,provider_subscription_id' })
  await supabase.from('profiles').update({ subscription_id: subscription.id, plan_status: subscription.status, updated_at: new Date().toISOString() }).eq('id', user.id)

  return { checkoutUrl: subscription.init_point, subscriptionId: subscription.id, status: subscription.status, plan: planId }
})

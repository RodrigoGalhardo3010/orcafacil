import { billingOffer, isBillingCycle } from '~~/shared/billing-catalog'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if (!user.email) throw createError({ statusCode: 400, statusMessage: 'Sua conta precisa ter um e-mail válido.' })
  const body = await readBody(event)
  const planId = body?.plan
  if (!isPaidPlanId(planId)) throw createError({ statusCode: 400, statusMessage: 'Escolha um plano válido.' })
  const cycle = body?.cycle ?? 'monthly'
  if (!isBillingCycle(cycle)) throw createError({ statusCode: 400, statusMessage: 'Escolha um período válido.' })
  const offer = billingOffer(planId, cycle)

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
  const { data: requestId, error: lockError } = await supabase.rpc('claim_billing_checkout', {
    p_user_id: user.id, p_plan: planId, p_cycle: cycle
  })
  if (lockError || !requestId) throw createError({ statusCode: 409, statusMessage: 'Uma tentativa de assinatura está em andamento. Aguarde dois minutos e tente novamente com o mesmo plano e período.' })
  let completed = false
  try {
  const { data: profile, error: profileError } = await supabase.from('profiles').select('subscription_id,plan,plan_status,paid_through').eq('id', user.id).single()
  if (profileError || !profile) throw createError({ statusCode: 500, statusMessage: 'Erro ao carregar sua conta.' })
  if (effectivePlan(profile) !== 'free') {
    completed = true
    throw createError({ statusCode: 409, statusMessage: 'Seu período pago ainda está ativo. Cancele a renovação e escolha outro plano ou período após o término do acesso, sem cobrança duplicada.' })
  }
  const { data: storedSubscription } = profile?.subscription_id
    ? await supabase.from('subscriptions').select('plan,billing_cycle').eq('provider', 'mercadopago').eq('provider_subscription_id', profile.subscription_id).maybeSingle()
    : { data: null }

  if (profile?.subscription_id) {
    const current = await mercadoPagoRequest(event, `/preapproval/${encodeURIComponent(profile.subscription_id)}`)
    if (current.status === 'authorized') {
      completed = true
      throw createError({ statusCode: 409, statusMessage: 'Você já possui uma assinatura em renovação. Atualize a confirmação do pagamento ou cancele a renovação antes de contratar outra.' })
    }

    if (current.status === 'pending' && storedSubscription?.plan === planId && storedSubscription?.billing_cycle === cycle && current.init_point) {
      completed = true
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
    headers: { 'X-Idempotency-Key': requestId },
    body: JSON.stringify({
      reason: `OrçaFácil ${plan.name} · ${offer.name}`,
      external_reference: user.id,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: offer.months,
        frequency_type: 'months',
        transaction_amount: offer.amountCents / 100,
        currency_id: 'BRL'
      },
      back_url: `${siteUrl}/dashboard/billing-return`,
      status: 'pending'
    })
  })

  if (!subscription.id || !subscription.init_point) throw createError({ statusCode: 502, statusMessage: 'O Mercado Pago não retornou o link de pagamento.' })
  const { error: saveError } = await supabase.from('subscriptions').upsert({
    user_id: user.id, provider: 'mercadopago', provider_subscription_id: subscription.id,
    status: subscription.status, plan: planId, amount: offer.amountCents / 100,
    amount_cents: offer.amountCents, billing_cycle: cycle, frequency_months: offer.months,
    price_version: offer.version, updated_at: new Date().toISOString()
  }, { onConflict: 'provider,provider_subscription_id' })
  if (saveError) throw createError({ statusCode: 500, statusMessage: 'Erro ao registrar assinatura. Tente novamente com o mesmo plano.' })
  const { error: accountError } = await supabase.from('profiles').update({ subscription_id: subscription.id, plan_status: subscription.status, updated_at: new Date().toISOString() }).eq('id', user.id)
  if (accountError) throw createError({ statusCode: 500, statusMessage: 'Erro ao vincular assinatura. Tente novamente com o mesmo plano.' })
  completed = true

  return { checkoutUrl: subscription.init_point, subscriptionId: subscription.id, status: subscription.status, plan: planId }
  } finally {
    await supabase.from('billing_checkout_attempts').update({
      locked_until: new Date(0).toISOString(), completed
    }).eq('user_id', user.id).eq('request_id', requestId)
  }
})

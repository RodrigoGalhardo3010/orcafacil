export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if (!user.email) throw createError({ statusCode: 400, statusMessage: 'Sua conta precisa ter um e-mail válido.' })
  const config = useRuntimeConfig(event)

  const subscription = await mercadoPagoRequest(event, '/preapproval', {
    method: 'POST',
    body: JSON.stringify({
      reason: 'OrçaFácil Pro',
      external_reference: user.id,
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 39.90,
        currency_id: 'BRL'
      },
      back_url: `${config.public.siteUrl}/dashboard?billing=return`,
      status: 'pending'
    })
  })

  const supabase = getAdminClient(event)
  await supabase.from('subscriptions').upsert({ user_id: user.id, provider: 'mercadopago', provider_subscription_id: subscription.id, status: subscription.status, plan: 'pro', amount: 39.90, updated_at: new Date().toISOString() }, { onConflict: 'provider,provider_subscription_id' })
  await supabase.from('profiles').update({ subscription_id: subscription.id, plan_status: subscription.status, updated_at: new Date().toISOString() }).eq('id', user.id)

  return { checkoutUrl: subscription.init_point, subscriptionId: subscription.id }
})

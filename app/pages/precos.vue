<script setup lang="ts">
import { billingOffer, BILLING_CYCLES, type BillingCycle } from '~~/shared/billing-catalog'
const cycle = ref<BillingCycle>('monthly')
const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
useSeoMeta({ title: 'Preços', description: 'Planos do OrçaFácil para enviar propostas comerciais profissionais.' })
</script>

<template>
  <div>
    <AppHeader />
    <main class="shell section">
      <div class="section-heading centered">
        <span class="eyebrow">PLANOS</span>
        <h1>Um plano para cada ritmo de vendas.</h1>
        <p class="lead small">Comece grátis e aumente o limite quando o OrçaFácil entrar na sua rotina.</p>
      </div>
      <BillingCycleSelector v-model="cycle" />
      <p class="lead small">Cobrança integral a cada {{ BILLING_CYCLES[cycle].months }} {{ cycle === 'monthly' ? 'mês' : 'meses' }}, com renovação automática. Os limites de envio continuam mensais, sem acumular.</p>
      <div class="pricing-grid">
        <article class="card pricing-card">
          <h2>Grátis</h2>
          <div class="big-price">R$ 0</div>
          <p>Para experimentar com clientes reais.</p>
          <ul class="check-list dark">
            <li>3 propostas enviadas por mês</li>
            <li>Criação assistida por IA</li>
            <li>PDF, link público e aceite</li>
            <li>Marca OrçaFácil no rodapé</li>
          </ul>
          <NuxtLink class="btn btn-secondary full" to="/login?mode=signup">Começar grátis</NuxtLink>
        </article>

        <article class="card pricing-card featured">
          <span class="plan-tag">RECOMENDADO</span>
          <h2>Essencial</h2>
          <div class="big-price">{{ money(billingOffer('essencial', cycle).amountCents) }} <small>/{{ BILLING_CYCLES[cycle].name.toLowerCase() }}</small></div>
          <p v-if="cycle !== 'monthly'">Equivale a {{ money(billingOffer('essencial', cycle).amountCents / BILLING_CYCLES[cycle].months) }}/mês. Pagamento integral do período.</p>
          <p>Para profissionais com fluxo constante de propostas.</p>
          <ul class="check-list dark">
            <li>25 propostas enviadas por mês</li>
            <li>Criação assistida por IA</li>
            <li>PDF, e-mail, WhatsApp e aceite</li>
            <li>Sem marca OrçaFácil no rodapé</li>
          </ul>
          <NuxtLink class="btn btn-primary full" :to="`/login?mode=signup&plan=essencial&cycle=${cycle}`">Escolher Essencial</NuxtLink>
        </article>

        <article class="card pricing-card">
          <h2>Pro</h2>
          <div class="big-price">{{ money(billingOffer('pro', cycle).amountCents) }} <small>/{{ BILLING_CYCLES[cycle].name.toLowerCase() }}</small></div>
          <p v-if="cycle !== 'monthly'">Equivale a {{ money(billingOffer('pro', cycle).amountCents / BILLING_CYCLES[cycle].months) }}/mês. Pagamento integral do período.</p>
          <p>Para quem envia propostas todos os dias.</p>
          <ul class="check-list dark">
            <li>Propostas ilimitadas</li>
            <li>Criação assistida por IA</li>
            <li>PDF, e-mail, WhatsApp e aceite</li>
            <li>Sem marca OrçaFácil no rodapé</li>
          </ul>
          <NuxtLink class="btn btn-dark full" :to="`/login?mode=signup&plan=pro&cycle=${cycle}`">Escolher Pro</NuxtLink>
        </article>
      </div>
      <p class="lead small">Cancele a renovação pelo painel. O acesso continua até o fim do período pago. Para mudar de plano ou período, cancele a renovação e contrate a nova opção após o término do acesso.</p>
    </main>
  </div>
</template>

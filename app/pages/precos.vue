<script setup lang="ts">
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
          <div class="big-price">R$ 19,90 <small>/mês</small></div>
          <p>Para profissionais com fluxo constante de propostas.</p>
          <ul class="check-list dark">
            <li>25 propostas enviadas por mês</li>
            <li>Criação assistida por IA</li>
            <li>PDF, e-mail, WhatsApp e aceite</li>
            <li>Sem marca OrçaFácil no rodapé</li>
          </ul>
          <NuxtLink class="btn btn-primary full" to="/login?mode=signup&plan=essencial">Assinar Essencial</NuxtLink>
        </article>

        <article class="card pricing-card">
          <h2>Pro</h2>
          <div class="big-price">R$ 39,90 <small>/mês</small></div>
          <p>Para quem envia propostas todos os dias.</p>
          <ul class="check-list dark">
            <li>Propostas ilimitadas</li>
            <li>Criação assistida por IA</li>
            <li>PDF, e-mail, WhatsApp e aceite</li>
            <li>Sem marca OrçaFácil no rodapé</li>
          </ul>
          <NuxtLink class="btn btn-dark full" to="/login?mode=signup&plan=pro">Assinar Pro</NuxtLink>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { utmSuffix } = useUtm()
useSeoMeta({
  title: 'Orçamento de ar-condicionado em minutos',
  description: 'Instalador: monte o orçamento de instalação e manutenção de ar-condicionado com o assistente, envie pelo WhatsApp e receba o aceite pelo link.'
})
</script>

<template>
  <div class="premium-home">
    <AppHeader />
    <main>
      <section class="hero shell premium-hero">
        <div class="hero-copy">
          <span class="eyebrow">● PARA INSTALADORES DE AR-CONDICIONADO</span>
          <h1>Do WhatsApp<br>ao orçamento<br><em>aceito.</em></h1>
          <p class="lead">O assistente faz as perguntas e prepara o orçamento para você — equipamento, BTUs, mão de obra, material, prazo e pagamento. Você envia o link e o cliente aceita pelo celular.</p>
          <div class="hero-actions">
            <NuxtLink class="btn btn-primary" :to="`/login?mode=signup${utmSuffix}`">Criar orçamento grátis ↗</NuxtLink>
            <NuxtLink class="btn btn-secondary" to="/p/demo">Ver um exemplo</NuxtLink>
          </div>
          <p class="fine-print">3 orçamentos grátis por mês. Sem cartão. Funciona no celular.</p>
        </div>
        <div class="quote-stage" aria-label="Exemplo de orçamento de ar-condicionado">
          <div class="stage-caption"><span>VISÃO DO ORÇAMENTO</span><span>DEMONSTRAÇÃO / 01</span></div>
          <article class="quote-glass">
            <div class="quote-top"><span>OF—2026 / 021</span><span class="status status-accepted">✓ Aceito</span></div>
            <div class="quote-title"><span class="eyebrow">CLIMATIZAÇÃO RESIDENCIAL</span><h2>Conforto para o verão inteiro.</h2><p>Instalação de split 12.000 BTUs</p></div>
            <div class="quote-client"><small>PREPARADO PARA</small><strong>Residência Silva</strong><small>VALIDADE · 10 DIAS</small></div>
            <div class="quote-line"><span>Split 12.000 BTUs (equipamento)</span><b>R$ 2.600,00</b></div>
            <div class="quote-line"><span>Instalação, suportes e dreno</span><b>R$ 900,00</b></div>
            <div class="quote-line"><span>Materiais e acabamento</span><b>R$ 400,00</b></div>
            <div class="quote-sum"><small>INVESTIMENTO TOTAL</small><strong>R$ 3.900<span>,00</span></strong></div>
            <div class="quote-progress"><span>01 Elaborado</span><span>02 Enviado</span><strong>03 Aceito ✓</strong></div>
          </article>
          <div class="quote-extras"><span>↗</span><div><strong>Pronto para enviar no WhatsApp</strong><small>Link para o cliente aceitar pelo celular.</small></div></div>
        </div>
      </section>

      <div class="sector-strip"><div class="shell"><span>PARA O SEU DIA A DIA</span><p>Instalação / Manutenção preventiva / Orçamento rápido</p></div></div>

      <section class="shell section">
        <div class="section-heading"><span class="eyebrow">MENOS DIGITAÇÃO. MAIS FECHAMENTO.</span><h2>Em 3 passos.<br>Do pedido ao aceite.</h2></div>
        <div class="feature-grid">
          <article class="feature card"><b>01 / CONVERSE</b><h3>Conte o serviço.</h3><p>O assistente faz as perguntas — tipo de split, BTUs, ambiente, material e prazo — e já organiza tudo.</p></article>
          <article class="feature card"><b>02 / REVISE</b><h3>Confira o orçamento.</h3><p>Ajuste valores, mão de obra e garantia. Tudo no seu controle antes de enviar.</p></article>
          <article class="feature card"><b>03 / ENVIE E ACEITE</b><h3>Compartilhe no WhatsApp.</h3><p>O cliente abre o link no celular, vê o orçamento e aceita por ali. Você acompanha o aceite.</p></article>
        </div>
      </section>

      <section class="shell confidence-section">
        <div><span class="eyebrow">FEITO PARA QUEM VENDE SERVIÇO</span><h2>Seu cliente entende.<br>Você fecha mais rápido.</h2><p class="lead small">Um orçamento organizado transmite confiança e reduz o vai-e-vem de perguntas no WhatsApp.</p><NuxtLink class="text-link" to="/p/demo">Veja como o cliente recebe ↗</NuxtLink></div>
        <div class="capability-list">
          <div><span>01</span><strong>Equipamento e capacidade em BTUs</strong></div>
          <div><span>02</span><strong>Mão de obra, material e prazo</strong></div>
          <div><span>03</span><strong>Forma de pagamento e garantia</strong></div>
          <div><span>04</span><strong>Aceite registrado pelo link</strong></div>
        </div>
      </section>

      <section class="shell launch-cta">
        <span class="eyebrow">SEU PRÓXIMO ORÇAMENTO EM MINUTOS</span>
        <h2>Pare de enviar<br><em>texto solto.</em></h2>
        <NuxtLink class="btn btn-primary" :to="`/login?mode=signup${utmSuffix}`">Criar orçamento grátis ↗</NuxtLink>
        <NuxtLink class="text-link" to="/precos">Conhecer os planos</NuxtLink>
      </section>
    </main>
    <footer class="footer shell"><span>© 2026 OrçaFácil · Feito para quem vende serviços.</span><div><NuxtLink to="/privacidade">Privacidade</NuxtLink><NuxtLink to="/termos">Termos</NuxtLink></div></footer>
  </div>
</template>

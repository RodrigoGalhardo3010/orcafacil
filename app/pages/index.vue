<script setup lang="ts">
useSeoMeta({
  title: 'Propostas comerciais profissionais em minutos',
  description: 'Crie propostas, envie pelo WhatsApp e acompanhe o aceite do cliente. Comece grátis.'
})
</script>

<template>
  <div>
    <AppHeader />
    <main>
      <section class="hero shell">
        <div class="hero-copy">
          <span class="eyebrow">ORÇAMENTOS QUE PASSAM CONFIANÇA</span>
          <h1>Pare de mandar orçamento perdido no WhatsApp.</h1>
          <p class="lead">Crie uma proposta profissional em poucos minutos, envie um link para o cliente e registre o aceite sem planilhas e sem PDF desatualizado.</p>
          <div class="hero-actions">
            <NuxtLink class="btn btn-primary" to="/login?mode=signup">Criar 3 propostas grátis</NuxtLink>
            <NuxtLink class="btn btn-secondary" to="/p/demo">Ver exemplo</NuxtLink>
          </div>
          <p class="fine-print">Sem cartão para começar. Plano gratuito com até 3 propostas enviadas por mês.</p>
        </div>
        <div class="proposal-preview card">
          <div class="preview-header">
            <div>
              <strong>Proposta #2026-014</strong>
              <span>Instalação de ar-condicionado</span>
            </div>
            <span class="status status-sent">Enviada</span>
          </div>
          <div class="preview-client">Cliente: Condomínio Jardim Azul</div>
          <div class="preview-row"><span>Instalação 12.000 BTUs</span><strong>R$ 850,00</strong></div>
          <div class="preview-row"><span>Materiais e acabamento</span><strong>R$ 320,00</strong></div>
          <div class="preview-total"><span>Total</span><strong>R$ 1.170,00</strong></div>
          <div class="preview-buttons"><span class="fake-btn accepted">Aceitar proposta</span><span class="fake-btn">Tenho uma dúvida</span></div>
        </div>
      </section>

      <section class="shell section">
        <div class="section-heading">
          <span class="eyebrow">SIMPLES DE VERDADE</span>
          <h2>Do orçamento ao aceite em três passos.</h2>
        </div>
        <div class="feature-grid">
          <article class="feature card"><b>1</b><h3>Monte a proposta</h3><p>Cliente, serviço, quantidade, preço, prazo e condições em um formulário direto.</p></article>
          <article class="feature card"><b>2</b><h3>Envie o link</h3><p>Compartilhe pelo WhatsApp ou e-mail. O cliente abre no celular sem precisar baixar nada.</p></article>
          <article class="feature card"><b>3</b><h3>Receba o aceite</h3><p>Veja abertura, aceite ou recusa e mantenha o histórico comercial organizado.</p></article>
        </div>
      </section>

      <section class="contrast-section">
        <div class="shell split">
          <div>
            <span class="eyebrow light">FEITO PARA QUEM VENDE SERVIÇO</span>
            <h2>Uma venda fechada já pode pagar meses do sistema.</h2>
          </div>
          <ul class="check-list">
            <li>Instalação e manutenção de ar-condicionado</li>
            <li>Energia solar, elétrica e segurança eletrônica</li>
            <li>Consultoria, software e serviços profissionais</li>
            <li>Arquitetura, fotografia e pequenos negócios B2B</li>
          </ul>
        </div>
      </section>

      <section class="shell section centered">
        <span class="eyebrow">PREÇO DE MVP, VALOR DE VENDA</span>
        <h2>Comece grátis. Pague quando virar rotina.</h2>
        <div class="pricing-mini card">
          <div><strong>Grátis</strong><span>3 propostas enviadas/mês</span></div>
          <div class="price">R$ 0</div>
          <NuxtLink class="btn btn-primary" to="/login?mode=signup">Começar agora</NuxtLink>
        </div>
        <NuxtLink class="text-link" to="/precos">Comparar planos →</NuxtLink>
      </section>
    </main>
    <footer class="footer shell">
      <span>© 2026 OrçaFácil</span>
      <div><NuxtLink to="/privacidade">Privacidade</NuxtLink><NuxtLink to="/termos">Termos</NuxtLink></div>
    </footer>
  </div>
</template>

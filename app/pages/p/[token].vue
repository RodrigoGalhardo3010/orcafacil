<script setup lang="ts">
const route = useRoute()
useSeoMeta({ title: 'Proposta comercial', description: 'Proposta comercial criada com OrçaFácil.' })
const loading = ref(true)
const proposal = ref<any>(null)
const rounds = ref<any[]>([])
const errorMessage = ref('')
const responseName = ref('')
const responseEmail = ref('')
const responding = ref(false)
const responseDone = ref('')
const negotiating = ref(false)
const negotiateDone = ref('')
const negotiateValue = ref('')
const negotiateTerms = ref('')
const negotiateMessage = ref('')
const counterResponding = ref(false)
const pdfUrl = computed(() => route.params.token === 'demo' ? '' : `/api/public/proposals/${route.params.token}/pdf`)

const openRound = computed(() => rounds.value.find(round => round.status === 'open') || null)
const sellerTurn = computed(() => openRound.value?.actor === 'seller' && openRound.value?.kind === 'counter')

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
function actorLabel(actor: string) {
  return actor === 'buyer' ? 'Você' : 'Vendedor'
}
function roundTitle(round: any) {
  if (round.kind === 'request') return `${actorLabel(round.actor)} pediu`
  if (round.kind === 'counter') return `${actorLabel(round.actor)} contrapropôs`
  if (round.kind === 'accept') return `${actorLabel(round.actor)} aceitou`
  return `${actorLabel(round.actor)} recusou`
}
function roundStatusLabel(status: string) {
  return ({ open: 'Aguardando resposta', accepted: 'Aceita', rejected: 'Recusada', superseded: 'Substituída' } as Record<string, string>)[status] || status
}
function roundValue(round: any) {
  if (round.kind === 'request' || round.kind === 'counter') return `${money(round.total)}${round.payment_terms ? ` · ${round.payment_terms}` : ''}`
  if (round.kind === 'accept' && round.total != null) return money(round.total)
  return ''
}

async function fetchProposal() {
  const result = await $fetch<any>(`/api/public/proposals/${route.params.token}`)
  proposal.value = result.proposal
  rounds.value = result.rounds || []
}

async function load() {
  if (route.params.token === 'demo') {
    proposal.value = {
      company_name: 'Clima Perfeito Instalações', number: '#2026-014', client_name: 'Condomínio Jardim Azul',
      title: 'Instalação de ar-condicionado', introduction: 'Obrigado pela oportunidade. Segue nossa proposta conforme alinhado.',
      items: [{ description: 'Instalação split 12.000 BTUs', quantity: 1, unit_price: 850 }, { description: 'Materiais e acabamento', quantity: 1, unit_price: 320 }],
      subtotal: 1170, discount: 0, total: 1170, payment_terms: '50% na aprovação e 50% na conclusão.', notes: 'Prazo de execução: até 3 dias úteis.', status: 'sent', valid_until: '2026-09-15', branded: true
    }
    rounds.value = []
    loading.value = false
    return
  }

  try {
    await fetchProposal()
    await $fetch(`/api/public/proposals/${route.params.token}/view`, { method: 'POST' }).catch(() => null)
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Proposta não encontrada ou indisponível.'
  } finally { loading.value = false }
}

async function respond(decision: 'accepted' | 'rejected') {
  if (route.params.token === 'demo') {
    responseDone.value = decision === 'accepted' ? 'Exemplo de aceite registrado.' : 'Exemplo de recusa registrada.'
    return
  }
  if (!responseName.value.trim()) {
    errorMessage.value = 'Informe seu nome para registrar a resposta.'
    return
  }
  responding.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/public/proposals/${route.params.token}/respond`, { method: 'POST', body: { decision, name: responseName.value, email: responseEmail.value } })
    proposal.value.status = decision
    responseDone.value = decision === 'accepted' ? 'Proposta aceita com sucesso.' : 'Resposta registrada. Obrigado.'
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Não foi possível registrar a resposta.'
  } finally { responding.value = false }
}

async function negotiate() {
  const value = Number(String(negotiateValue.value).replace(/\./g, '').replace(',', '.'))
  if (!Number.isFinite(value) || value <= 0) {
    errorMessage.value = 'Informe o valor que deseja negociar.'
    return
  }
  negotiating.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/public/proposals/${route.params.token}/negotiate`, {
      method: 'POST',
      body: { requested_total: value, requested_payment_terms: negotiateTerms.value, message: negotiateMessage.value }
    })
    negotiateDone.value = 'Solicitação de desconto enviada. Acompanhe a negociação abaixo.'
    await fetchProposal()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Não foi possível enviar a solicitação.'
  } finally { negotiating.value = false }
}

async function respondToCounter(decision: 'accept' | 'reject') {
  if (decision === 'accept' && !responseName.value.trim()) {
    errorMessage.value = 'Informe seu nome para aceitar a contraproposta.'
    return
  }
  counterResponding.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/public/proposals/${route.params.token}/negotiate/respond`, {
      method: 'POST',
      body: { decision, name: responseName.value, email: responseEmail.value }
    })
    responseDone.value = decision === 'accept'
      ? 'Contraproposta aceita. Negociação concluída com sucesso.'
      : 'Contraproposta recusada. A proposta voltou ao valor original.'
    await fetchProposal()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Não foi possível registrar sua resposta.'
  } finally { counterResponding.value = false }
}

onMounted(load)
</script>

<template>
  <main class="public-proposal-page">
    <div v-if="loading" class="proposal-document card">Carregando proposta...</div>
    <div v-else-if="errorMessage && !proposal" class="proposal-document card"><h1>Proposta indisponível</h1><p>{{ errorMessage }}</p></div>
    <article v-else-if="proposal" class="proposal-document card">
      <header class="document-header"><div><span class="eyebrow">PROPOSTA COMERCIAL</span><h1>{{ proposal.company_name }}</h1></div><div class="document-number"><strong>{{ proposal.number }}</strong><StatusBadge :status="proposal.status" /></div></header>
      <section class="document-client"><span>Preparada para</span><strong>{{ proposal.client_name }}</strong><small v-if="proposal.valid_until">Válida até {{ new Date(`${proposal.valid_until}T12:00:00`).toLocaleDateString('pt-BR') }}</small></section>
      <section><h2>{{ proposal.title }}</h2><p class="document-intro">{{ proposal.introduction }}</p></section>
      <section class="document-items"><div class="document-item document-item-head"><span>Descrição</span><span>Qtd.</span><span>Valor</span><span>Total</span></div><div v-for="(item, index) in proposal.items" :key="index" class="document-item"><span>{{ item.description }}</span><span>{{ item.quantity }}</span><span>{{ money(item.unit_price) }}</span><strong>{{ money(item.quantity * item.unit_price) }}</strong></div></section>
      <section class="document-total"><span>Subtotal <strong>{{ money(proposal.subtotal) }}</strong></span><span v-if="proposal.discount">Desconto <strong>- {{ money(proposal.discount) }}</strong></span><span class="grand">Total <strong>{{ money(proposal.total) }}</strong></span></section>
      <section class="document-terms"><div><h3>Condições de pagamento</h3><p>{{ proposal.payment_terms || 'A combinar.' }}</p></div><div v-if="proposal.notes"><h3>Observações</h3><p>{{ proposal.notes }}</p></div></section>

      <section v-if="pdfUrl" class="pdf-copy-note"><div><strong>Guarde uma cópia</strong><span>Baixe o PDF para consulta. O aceite ou a recusa deve ser registrado nesta página.</span></div><a class="btn btn-secondary btn-small" :href="pdfUrl" download>Baixar PDF</a></section>

      <section v-if="rounds.length" class="negotiation-box">
        <h2>Histórico da negociação</h2>
        <ol class="negotiation-timeline">
          <li class="round-row round-baseline">
            <div class="round-head"><strong>Proposta original</strong></div>
            <div class="round-body">{{ money(proposal.original_total ?? proposal.total) }}<span v-if="proposal.original_payment_terms || proposal.payment_terms"> · {{ proposal.original_payment_terms || proposal.payment_terms }}</span></div>
          </li>
          <li v-for="round in rounds" :key="round.id || round.seq" class="round-row" :class="`round-${round.status}`">
            <div class="round-head"><strong>{{ roundTitle(round) }}</strong><span class="round-chip">{{ roundStatusLabel(round.status) }}</span></div>
            <div v-if="roundValue(round)" class="round-body">{{ roundValue(round) }}</div>
            <div v-if="round.message" class="round-message">“{{ round.message }}”</div>
            <div class="round-time">{{ new Date(round.created_at).toLocaleString('pt-BR') }}</div>
          </li>
        </ol>
      </section>

      <section v-if="proposal.status === 'negotiating' && openRound?.actor === 'buyer'" class="negotiation-box notice-neutral">
        <h2>Solicitação de desconto enviada</h2>
        <p>Seu pedido foi enviado e está aguardando a resposta do vendedor. Acompanhe por este link — a proposta será atualizada aqui.</p>
      </section>

      <section v-if="sellerTurn" class="negotiation-box counter-box">
        <h2>Contraproposta do vendedor</h2>
        <p>O vendedor contrapropôs <strong>{{ money(openRound.total) }}</strong><span v-if="openRound.payment_terms"> com a condição <strong>{{ openRound.payment_terms }}</strong></span>.</p>
        <p class="counter-warning">⚠️ Regra da negociação: esta é a <strong>única contraproposta</strong>. Você pode apenas <strong>aceitar</strong> ou <strong>recusar</strong> — não é possível pedir outro valor por aqui.</p>
        <div class="form-grid two"><label>Nome<input v-model="responseName" placeholder="Seu nome" /></label><label>E-mail (opcional)<input v-model="responseEmail" type="email" placeholder="seu@email.com" /></label></div>
        <div class="response-actions"><button class="btn btn-primary" :disabled="counterResponding" @click="respondToCounter('accept')">{{ counterResponding ? 'Registrando...' : 'Aceitar contraproposta' }}</button><button class="btn btn-secondary" :disabled="counterResponding" @click="respondToCounter('reject')">{{ counterResponding ? 'Registrando...' : 'Recusar contraproposta' }}</button></div>
      </section>

      <section v-if="proposal.status === 'sent' && !rounds.length" class="response-box">
        <h2>Negociar valor</h2><p>Quer um valor ou uma condição diferentes? Envie sua proposta e o vendedor pode aceitar, recusar ou fazer uma contraproposta.</p>
        <p class="fine-print">Se o vendedor fizer uma contraproposta, ela será única: você poderá apenas aceitar ou recusar.</p>
        <div class="form-grid two"><label>Valor desejado (R$)<input v-model="negotiateValue" inputmode="decimal" placeholder="Ex.: 1000,00" /></label><label>Condição de pagamento<input v-model="negotiateTerms" placeholder="Ex.: 10x sem juros" /></label></div>
        <label>Mensagem (opcional)<textarea v-model="negotiateMessage" rows="2" placeholder="Explique o motivo do pedido." /></label>
        <div class="response-actions"><button class="btn btn-secondary" :disabled="negotiating" @click="negotiate">{{ negotiating ? 'Enviando...' : 'Solicitar desconto' }}</button></div>
      </section>

      <section v-if="proposal.status === 'sent'" class="response-box">
        <h2>Responder proposta</h2><p>Informe seu nome e registre sua decisão.</p><div class="form-grid two"><label>Nome<input v-model="responseName" placeholder="Seu nome" /></label><label>E-mail (opcional)<input v-model="responseEmail" type="email" placeholder="seu@email.com" /></label></div><div class="response-actions"><button class="btn btn-primary" :disabled="responding" @click="respond('accepted')">Aceitar proposta</button><button class="btn btn-secondary" :disabled="responding" @click="respond('rejected')">Recusar</button></div><p class="fine-print">Este recurso registra o aceite comercial e seus metadados básicos. Não substitui assinatura eletrônica qualificada quando a operação exigir formalidade específica.</p>
      </section>
      <p v-if="responseDone || negotiateDone" class="notice success">{{ responseDone || negotiateDone }}</p><p v-else-if="errorMessage" class="notice error">{{ errorMessage }}</p>
      <footer v-if="proposal.branded !== false" class="powered-by">Proposta criada com <NuxtLink to="/">OrçaFácil</NuxtLink></footer>
    </article>
  </main>
</template>

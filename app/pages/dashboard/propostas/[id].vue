<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Editar proposta' })

const route = useRoute()
const { request } = useApi()
const loading = ref(true)
const saving = ref(false)
const sending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const publicUrl = ref('')
const pdfUrl = ref('')
const proposal = ref<any>(null)
const sharing = ref(false)
const rounds = ref<any[]>([])
const negotiatingAction = ref('')
const counterTotal = ref('')
const counterTerms = ref('')
const openRound = computed(() => rounds.value.find(r => r.status === 'open') || null)
const sellerTurn = computed(() => openRound.value?.actor === 'buyer' && openRound.value?.kind === 'request')

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
function actorLabel(actor: string) {
  return actor === 'seller' ? 'Você' : 'Cliente'
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
const subtotal = computed(() => proposal.value?.items?.reduce((sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0) || 0)
const total = computed(() => Math.max(0, subtotal.value - Number(proposal.value?.discount || 0)))

async function load() {
  try {
    const result = await request<any>(`/api/proposals/${route.params.id}`)
    proposal.value = result.proposal
    publicUrl.value = result.publicUrl
    pdfUrl.value = result.pdfUrl
    rounds.value = result.rounds || []
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Não foi possível carregar.'
  } finally {
    loading.value = false
  }
}
function addItem() { proposal.value.items.push({ description: '', quantity: 1, unit_price: 0 }) }
function removeItem(index: string | number) { if (proposal.value.items.length > 1) proposal.value.items.splice(Number(index), 1) }

async function save() {
  saving.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const result = await request<any>(`/api/proposals/${route.params.id}`, { method: 'PUT', body: proposal.value })
    proposal.value = result.proposal
    successMessage.value = 'Alterações salvas.'
    return true
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Erro ao salvar.'
    return false
  } finally { saving.value = false }
}

async function sendProposal() {
  sending.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    if (!await save()) return
    const result = await request<any>(`/api/proposals/${route.params.id}/send`, { method: 'POST' })
    proposal.value = { ...proposal.value, ...result.proposal }
    publicUrl.value = result.publicUrl
    pdfUrl.value = result.pdfUrl
    successMessage.value = result.emailSent
      ? 'Proposta enviada! Compartilhe o link pelo WhatsApp abaixo.'
      : (proposal.value.client_email
        ? 'Proposta enviada, mas o e-mail não foi entregue. Compartilhe o link pelo WhatsApp abaixo.'
        : 'Proposta enviada! Compartilhe o link pelo WhatsApp abaixo.')
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Erro ao enviar.'
  } finally { sending.value = false }
}

async function copyLink() {
  await navigator.clipboard.writeText(publicUrl.value)
  successMessage.value = 'Link copiado.'
}

function whatsappMessage() {
  return `Olá, ${proposal.value?.client_name}. Segue a proposta comercial ${proposal.value?.number || ''} em PDF para você guardar.\n\nPara visualizar a versão atual e aceitar ou recusar a proposta, acesse:\n${publicUrl.value}\n\nPDF para baixar e guardar:\n${pdfUrl.value}`
}

function whatsappUrl() {
  const phone = String(proposal.value?.client_phone || '').replace(/\D/g, '')
  const text = encodeURIComponent(whatsappMessage())
  return `https://wa.me/${phone ? `55${phone.replace(/^55/, '')}` : ''}?text=${text}`
}

async function shareWhatsApp() {
  if (!pdfUrl.value || sharing.value) return
  sharing.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    if (navigator.share && navigator.canShare) {
      const response = await fetch(pdfUrl.value)
      if (!response.ok) throw new Error('Não foi possível preparar o PDF.')
      const file = new File([await response.blob()], proposalPdfName(), { type: 'application/pdf' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title: proposal.value.title, text: whatsappMessage(), files: [file] })
        successMessage.value = 'PDF e link preparados para compartilhamento.'
        return
      }
    }
    window.open(whatsappUrl(), '_blank', 'noopener,noreferrer')
    successMessage.value = 'WhatsApp aberto com o link de aceite e o link do PDF.'
  } catch (error: any) {
    if (error?.name !== 'AbortError') errorMessage.value = error?.message || 'Não foi possível compartilhar a proposta.'
  } finally {
    sharing.value = false
  }
}

async function respondToNegotiation(decision: 'accept' | 'reject' | 'counter') {
  const open = openRound.value
  if (!open) return
  if (decision === 'counter' && !counterTotal.value) {
    errorMessage.value = 'Informe o valor da contraproposta.'
    return
  }
  negotiatingAction.value = decision
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const body: any = { decision }
    if (decision === 'counter') {
      body.counter_total = Number(String(counterTotal.value).replace(/\./g, '').replace(',', '.'))
      body.counter_payment_terms = counterTerms.value
    }
    const result = await request<any>(`/api/proposals/${route.params.id}/negotiate/respond`, { method: 'POST', body })
    proposal.value = { ...proposal.value, ...result.proposal }
    const mark = (status: string) => rounds.value.map(r => r.id === open.id ? { ...r, status } : r)
    if (decision === 'accept') {
      rounds.value = mark('accepted')
      successMessage.value = result.emailSent ? 'Desconto aplicado e proposta reenviada por e-mail.' : 'Desconto aplicado. Reenvie o link pelo WhatsApp abaixo.'
    } else if (decision === 'reject') {
      rounds.value = mark('rejected')
      successMessage.value = 'Solicitação recusada. A proposta continua válida com o valor original.'
    } else {
      rounds.value = mark('superseded')
      counterTotal.value = ''
      counterTerms.value = ''
      successMessage.value = result.emailSent ? 'Contraproposta enviada e cliente avisado por e-mail.' : 'Contraproposta enviada. Avise o cliente pelo WhatsApp abaixo.'
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Erro ao responder.'
  } finally { negotiatingAction.value = '' }
}

function proposalPdfName() {
  const number = String(proposal.value?.number || 'proposta').replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase()
  return `${number || 'proposta'}.pdf`
}

onMounted(load)
</script>

<template>
  <div>
    <AppHeader authenticated />
    <main class="editor shell">
      <div class="dashboard-heading"><div><span class="eyebrow">PROPOSTA</span><h1>{{ proposal?.number || 'Carregando...' }}</h1></div><NuxtLink class="text-link" to="/dashboard">← Voltar</NuxtLink></div>
      <div v-if="loading" class="card empty">Carregando...</div>
      <template v-else-if="proposal">
        <div class="share-bar card">
          <div><StatusBadge :status="proposal.status" /><span v-if="proposal.status !== 'draft' && publicUrl" class="share-url">{{ publicUrl }}</span></div>
          <div class="share-actions">
            <button v-if="proposal.status !== 'draft' && publicUrl" class="btn btn-secondary btn-small" @click="copyLink">Copiar link</button>
            <a v-if="proposal.status !== 'draft' && pdfUrl" class="btn btn-secondary btn-small" :href="pdfUrl" download>Baixar PDF</a>
            <button v-if="proposal.status !== 'draft' && publicUrl" type="button" class="btn btn-dark btn-small" :disabled="sharing" @click="shareWhatsApp">{{ sharing ? 'Preparando PDF...' : 'WhatsApp' }}</button>
            <button class="btn btn-primary btn-small" :disabled="sending" @click="sendProposal">{{ sending ? 'Enviando...' : (proposal.status === 'draft' ? 'Enviar proposta' : 'Reenviar') }}</button>
          </div>
        </div>
        <section v-if="rounds.length" class="card form-section negotiation-card">
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

        <section v-if="sellerTurn" class="card form-section negotiation-card">
          <h2>Solicitação de desconto</h2>
          <p><strong>{{ proposal.client_name }}</strong> pediu <strong>{{ money(openRound.total) }}</strong><span v-if="openRound.payment_terms"> com a condição: {{ openRound.payment_terms }}</span>.</p>
          <p v-if="openRound.message" class="negotiation-message">"{{ openRound.message }}"</p>
          <p class="fine-print">Lembrete: você pode fazer apenas uma contraproposta. Depois dela, o cliente só poderá aceitar ou recusar.</p>
          <div class="negotiation-actions">
            <button class="btn btn-primary btn-small" :disabled="!!negotiatingAction" @click="respondToNegotiation('accept')">{{ negotiatingAction === 'accept' ? 'Aplicando...' : 'Aceitar e reenviar' }}</button>
            <button class="btn btn-secondary btn-small" :disabled="!!negotiatingAction" @click="respondToNegotiation('reject')">{{ negotiatingAction === 'reject' ? 'Recusando...' : 'Recusar' }}</button>
          </div>
          <div class="counter-row">
            <input v-model="counterTotal" inputmode="decimal" placeholder="Valor da contraproposta (R$)" />
            <input v-model="counterTerms" placeholder="Condição de pagamento" />
            <button class="btn btn-dark btn-small" :disabled="!!negotiatingAction" @click="respondToNegotiation('counter')">{{ negotiatingAction === 'counter' ? 'Enviando...' : 'Fazer contraproposta' }}</button>
          </div>
        </section>

        <section v-else-if="openRound" class="card form-section negotiation-card">
          <h2>Contraproposta enviada</h2>
          <p>Você contrapropôs <strong>{{ money(openRound.total) }}</strong><span v-if="openRound.payment_terms"> com a condição: {{ openRound.payment_terms }}</span>. Agora está aguardando a resposta do cliente (ele só poderá aceitar ou recusar).</p>
        </section>
        <form class="editor-grid" @submit.prevent="save">
          <section class="card form-section"><h2>Cliente</h2><div class="form-grid two"><label>Nome / empresa<input v-model="proposal.client_name" required /></label><label>E-mail<input v-model="proposal.client_email" type="email" /></label><label>WhatsApp<input v-model="proposal.client_phone" /></label><label>Validade<input v-model="proposal.valid_until" type="date" /></label></div></section>
          <section class="card form-section"><h2>Proposta</h2><label>Título<input v-model="proposal.title" required /></label><label>Apresentação<textarea v-model="proposal.introduction" rows="3" /></label></section>
          <section class="card form-section"><div class="inline-title"><h2>Itens</h2><button type="button" class="text-link link-button" @click="addItem">+ Adicionar item</button></div><div v-for="(item, index) in proposal.items" :key="item.id || index" class="item-row"><input v-model="item.description" required /><input v-model.number="item.quantity" min="0.01" step="0.01" type="number" /><input v-model.number="item.unit_price" min="0" step="0.01" type="number" /><button type="button" class="remove-button" @click="removeItem(index)">×</button></div><div class="totals"><span>Subtotal <strong>{{ money(subtotal) }}</strong></span><label>Desconto <input v-model.number="proposal.discount" min="0" step="0.01" type="number" /></label><span class="grand-total">Total <strong>{{ money(total) }}</strong></span></div></section>
          <section class="card form-section"><h2>Condições</h2><label>Pagamento<textarea v-model="proposal.payment_terms" rows="2" /></label><label>Observações<textarea v-model="proposal.notes" rows="3" /></label></section>
          <p v-if="successMessage" class="notice success">{{ successMessage }}</p><p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
          <div class="editor-actions"><button class="btn btn-secondary" :disabled="saving">{{ saving ? 'Salvando...' : 'Salvar alterações' }}</button></div>
        </form>
      </template>
    </main>
  </div>
</template>

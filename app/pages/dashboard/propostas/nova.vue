<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Nova proposta com IA' })

type Item = { description: string; quantity: number; unit_price: number }
type Draft = {
  service_area: string; client_name: string; client_email: string; client_phone: string
  title: string; introduction: string; valid_until: string; payment_terms: string
  notes: string; discount: number; items: Item[]
}
type ChatMessage = { role: 'user' | 'assistant'; content: string }

const areas = [
  { id: 'climatizacao', icon: '❄️', name: 'Climatização', help: 'Instalação, manutenção e limpeza' },
  { id: 'mecanica', icon: '🔧', name: 'Mecânica', help: 'Revisão, reparos, peças e mão de obra' },
  { id: 'odontologia', icon: '🦷', name: 'Odontologia', help: 'Tratamentos e procedimentos definidos' },
  { id: 'marcenaria', icon: '🪚', name: 'Marcenaria', help: 'Móveis, projetos, fabricação e instalação' },
  { id: 'eletrica', icon: '⚡', name: 'Elétrica', help: 'Instalações, reparos e adequações' },
  { id: 'hidraulica', icon: '💧', name: 'Hidráulica', help: 'Instalações, vazamentos e manutenção' },
  { id: 'construcao', icon: '🏗️', name: 'Obras e reformas', help: 'Construção, pintura e acabamento' },
  { id: 'tecnologia', icon: '💻', name: 'Tecnologia', help: 'Suporte, sistemas e infraestrutura' },
  { id: 'outros', icon: '📋', name: 'Outra área', help: 'Qualquer serviço profissional' }
]

const { request } = useApi()
const mode = ref<'choice' | 'ai' | 'manual'>('choice')
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const answer = ref('')
const ready = ref(false)
const messages = ref<ChatMessage[]>([])
const chatMessages = ref<HTMLElement | null>(null)
let activeInterview: AbortController | null = null
let interviewSequence = 0
const form = reactive<Draft>({
  service_area: '', client_name: '', client_email: '', client_phone: '', title: '',
  introduction: 'Obrigado pela oportunidade. Apresentamos abaixo nossa proposta comercial para a execução dos serviços descritos.',
  valid_until: '', payment_terms: '', notes: '', discount: 0,
  items: [{ description: '', quantity: 1, unit_price: 0 }]
})

const selectedArea = computed(() => areas.find(area => area.id === form.service_area))
const subtotal = computed(() => form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0))
const total = computed(() => Math.max(0, subtotal.value - Number(form.discount || 0)))

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
function addItem() { form.items.push({ description: '', quantity: 1, unit_price: 0 }) }
function removeItem(index: number) { if (form.items.length > 1) form.items.splice(index, 1) }
function applyDraft(draft: Draft) {
  Object.assign(form, draft)
  form.items = draft.items?.length ? draft.items : [{ description: '', quantity: 1, unit_price: 0 }]
}
async function scrollToLatestMessage(behavior: ScrollBehavior = 'smooth') {
  await nextTick()
  chatMessages.value?.scrollTo({ top: chatMessages.value.scrollHeight, behavior })
}
function cancelInterview() {
  interviewSequence++
  activeInterview?.abort()
  activeInterview = null
  loading.value = false
}
function chooseAnotherArea() {
  cancelInterview()
  mode.value = 'choice'
  messages.value = []
  errorMessage.value = ''
}
function chooseManual() {
  cancelInterview()
  mode.value = 'manual'
  ready.value = true
  errorMessage.value = ''
}
async function chooseArea(area: typeof areas[number]) {
  cancelInterview()
  mode.value = 'ai'
  form.service_area = area.id
  messages.value = [{ role: 'user', content: `Quero criar uma proposta na área de ${area.name}.` }]
  await interview()
}
async function sendAnswer() {
  const content = answer.value.trim()
  if (!content || loading.value) return
  messages.value.push({ role: 'user', content })
  answer.value = ''
  await interview()
}
async function interview() {
  const sequence = ++interviewSequence
  activeInterview?.abort()
  const controller = new AbortController()
  activeInterview = controller
  const timeout = window.setTimeout(() => controller.abort(), 70000)
  loading.value = true
  errorMessage.value = ''
  await scrollToLatestMessage()
  try {
    const result = await request<{ draft: Draft; assistant_message: string; ready: boolean }>('/api/ai/quote-interview', {
      method: 'POST', body: { messages: messages.value, draft: form }, signal: controller.signal
    })
    if (sequence !== interviewSequence) return
    if (!result?.draft || !result?.assistant_message?.trim()) {
      throw new Error('A IA não enviou a próxima pergunta. Tente novamente; seu rascunho foi preservado.')
    }
    applyDraft(result.draft)
    messages.value.push({ role: 'assistant', content: result.assistant_message.trim() })
    ready.value = result.ready
  } catch (error: any) {
    if (sequence !== interviewSequence) return
    errorMessage.value = controller.signal.aborted
      ? 'A IA demorou mais do que o esperado. Seu rascunho foi preservado e você pode tentar novamente.'
      : (error?.data?.statusMessage || error?.message || 'Não foi possível consultar a IA. Seu rascunho foi preservado.')
  } finally {
    window.clearTimeout(timeout)
    if (sequence === interviewSequence) {
      loading.value = false
      activeInterview = null
      await scrollToLatestMessage()
    }
  }
}
async function retryInterview() {
  if (loading.value || messages.value.at(-1)?.role !== 'user') return
  await interview()
}
async function save() {
  saving.value = true
  errorMessage.value = ''
  try {
    const result = await request<{ proposal: { id: string } }>('/api/proposals', { method: 'POST', body: form })
    await navigateTo(`/dashboard/propostas/${result.proposal.id}`)
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Não foi possível salvar.'
  } finally {
    saving.value = false
  }
}

watch(() => messages.value.length, () => scrollToLatestMessage())
onBeforeUnmount(cancelInterview)
</script>

<template>
  <div>
    <AppHeader authenticated />
    <main class="editor shell">
      <div class="dashboard-heading">
        <div><span class="eyebrow">NOVA PROPOSTA</span><h1>Crie um orçamento profissional</h1><p>A IA coleta os detalhes e prepara a proposta para você revisar.</p></div>
        <NuxtLink class="text-link" to="/dashboard">Cancelar</NuxtLink>
      </div>

      <section v-if="mode === 'choice'" class="creation-choice">
        <div class="card ai-intro-card">
          <span class="ai-badge">✨ ASSISTENTE ORÇAFÁCIL</span>
          <h2>Qual é a área do serviço?</h2>
          <p>As perguntas serão adaptadas ao seu trabalho. A IA nunca inventa valores ou informações técnicas.</p>
          <div class="area-grid">
            <button v-for="area in areas" :key="area.id" type="button" class="area-card" @click="chooseArea(area)">
              <span>{{ area.icon }}</span><strong>{{ area.name }}</strong><small>{{ area.help }}</small>
            </button>
          </div>
        </div>
        <button type="button" class="manual-link" @click="chooseManual">Prefiro preencher manualmente</button>
      </section>

      <div v-else-if="mode === 'ai' && !ready" class="assistant-layout">
        <section class="card assistant-card">
          <div class="assistant-header"><div><span class="ai-avatar">O</span><div><strong>Assistente OrçaFácil</strong><small>{{ selectedArea?.name }}</small></div></div><button type="button" class="text-link link-button" @click="chooseAnotherArea">Trocar área</button></div>
          <div ref="chatMessages" class="chat-messages" aria-live="polite">
            <div v-for="(message, index) in messages" :key="index" :class="['chat-message', message.role]">{{ message.content }}</div>
            <div v-if="loading" class="chat-message assistant typing">Analisando sua resposta… Isso pode levar alguns segundos.</div>
            <div v-else-if="errorMessage" class="chat-message assistant chat-error" role="alert">
              <span>{{ errorMessage }}</span>
              <button v-if="messages.at(-1)?.role === 'user'" type="button" class="retry-button" @click="retryInterview">Tentar novamente</button>
            </div>
          </div>
          <form class="chat-input" @submit.prevent="sendAnswer">
            <textarea v-model="answer" rows="2" :disabled="loading" placeholder="Responda com suas palavras…" @keydown.enter.exact.prevent="sendAnswer" />
            <button class="btn btn-primary" :disabled="loading || !answer.trim()">Enviar</button>
          </form>
        </section>
        <aside class="card draft-card"><span class="eyebrow">RASCUNHO EM TEMPO REAL</span><h3>{{ form.title || 'Sua proposta' }}</h3><p>{{ form.client_name || 'Cliente ainda não informado' }}</p><div v-if="form.items.length && form.items[0]?.description" class="draft-items"><div v-for="(item, index) in form.items" :key="index"><span>{{ item.description }}</span><strong>{{ money(item.quantity * item.unit_price) }}</strong></div></div><div class="draft-total"><span>Total</span><strong>{{ money(total) }}</strong></div><small>Você poderá revisar tudo antes de salvar.</small></aside>
      </div>

      <form v-else class="editor-grid" @submit.prevent="save">
        <div v-if="mode === 'ai'" class="notice success review-notice"><strong>Rascunho elaborado.</strong> Revise os dados e ajuste o que precisar antes de salvar.</div>
        <section class="card form-section">
          <h2>Cliente</h2>
          <div class="form-grid two">
            <label>Nome / empresa<input v-model="form.client_name" required placeholder="Cliente" /></label>
            <label>E-mail<input v-model="form.client_email" type="email" placeholder="cliente@email.com" /></label>
            <label>WhatsApp<input v-model="form.client_phone" placeholder="(11) 99999-9999" /></label>
            <label>Validade<input v-model="form.valid_until" type="date" /></label>
          </div>
        </section>
        <section class="card form-section"><h2>Proposta</h2><label>Título<input v-model="form.title" required placeholder="Ex.: Reforma do escritório" /></label><label>Apresentação<textarea v-model="form.introduction" rows="3" /></label></section>
        <section class="card form-section">
          <div class="inline-title"><h2>Serviços e materiais</h2><button type="button" class="text-link link-button" @click="addItem">+ Adicionar item</button></div>
          <div v-for="(item, index) in form.items" :key="index" class="item-row"><input v-model="item.description" required placeholder="Descrição detalhada" /><input v-model.number="item.quantity" required min="0.01" step="0.01" type="number" placeholder="Qtd." /><input v-model.number="item.unit_price" required min="0" step="0.01" type="number" placeholder="Valor unitário" /><button type="button" class="remove-button" @click="removeItem(index)">×</button></div>
          <div class="totals"><span>Subtotal <strong>{{ money(subtotal) }}</strong></span><label>Desconto <input v-model.number="form.discount" min="0" step="0.01" type="number" /></label><span class="grand-total">Total <strong>{{ money(total) }}</strong></span></div>
        </section>
        <section class="card form-section"><h2>Condições</h2><label>Pagamento<textarea v-model="form.payment_terms" rows="2" /></label><label>Escopo e observações<textarea v-model="form.notes" rows="4" placeholder="Prazo, garantia, inclusões, exclusões e detalhes técnicos..." /></label></section>
        <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
        <div class="editor-actions"><button v-if="mode === 'ai'" type="button" class="btn btn-secondary" @click="ready = false">Continuar conversa</button><button class="btn btn-primary" :disabled="saving">{{ saving ? 'Salvando...' : 'Salvar proposta' }}</button></div>
      </form>
    </main>
  </div>
</template>

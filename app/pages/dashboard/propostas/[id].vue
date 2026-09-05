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
const proposal = ref<any>(null)

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
const subtotal = computed(() => proposal.value?.items?.reduce((sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0) || 0)
const total = computed(() => Math.max(0, subtotal.value - Number(proposal.value?.discount || 0)))

async function load() {
  try {
    const result = await request<any>(`/api/proposals/${route.params.id}`)
    proposal.value = result.proposal
    publicUrl.value = result.publicUrl
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
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Erro ao salvar.'
  } finally { saving.value = false }
}

async function sendProposal() {
  sending.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    await save()
    const result = await request<any>(`/api/proposals/${route.params.id}/send`, { method: 'POST' })
    proposal.value.status = 'sent'
    publicUrl.value = result.publicUrl
    successMessage.value = result.emailSent ? 'Proposta enviada por e-mail e liberada para compartilhamento.' : 'Proposta liberada. Copie o link e envie ao cliente.'
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Erro ao enviar.'
  } finally { sending.value = false }
}

async function copyLink() {
  await navigator.clipboard.writeText(publicUrl.value)
  successMessage.value = 'Link copiado.'
}

function whatsappUrl() {
  const phone = String(proposal.value?.client_phone || '').replace(/\D/g, '')
  const text = encodeURIComponent(`Olá, ${proposal.value?.client_name}. Segue nossa proposta comercial: ${publicUrl.value}`)
  return `https://wa.me/${phone ? `55${phone.replace(/^55/, '')}` : ''}?text=${text}`
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
          <div><StatusBadge :status="proposal.status" /><span v-if="publicUrl" class="share-url">{{ publicUrl }}</span></div>
          <div class="share-actions">
            <button v-if="publicUrl" class="btn btn-secondary btn-small" @click="copyLink">Copiar link</button>
            <a v-if="publicUrl" class="btn btn-dark btn-small" :href="whatsappUrl()" target="_blank" rel="noopener">WhatsApp</a>
            <button class="btn btn-primary btn-small" :disabled="sending" @click="sendProposal">{{ sending ? 'Enviando...' : (proposal.status === 'draft' ? 'Enviar proposta' : 'Reenviar') }}</button>
          </div>
        </div>
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

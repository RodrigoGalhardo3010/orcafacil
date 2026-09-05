<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Nova proposta' })

const { request } = useApi()
const loading = ref(false)
const errorMessage = ref('')
const form = reactive({
  client_name: '',
  client_email: '',
  client_phone: '',
  title: '',
  introduction: 'Obrigado pela oportunidade. Segue nossa proposta comercial conforme alinhado.',
  valid_until: '',
  payment_terms: 'Pagamento a combinar.',
  notes: '',
  discount: 0,
  items: [{ description: '', quantity: 1, unit_price: 0 }]
})

function addItem() {
  form.items.push({ description: '', quantity: 1, unit_price: 0 })
}
function removeItem(index: number) {
  if (form.items.length > 1) form.items.splice(index, 1)
}
function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
const subtotal = computed(() => form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0))
const total = computed(() => Math.max(0, subtotal.value - Number(form.discount || 0)))

async function save() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await request<{ proposal: { id: string } }>('/api/proposals', { method: 'POST', body: form })
    await navigateTo(`/dashboard/propostas/${result.proposal.id}`)
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Não foi possível salvar.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppHeader authenticated />
    <main class="editor shell">
      <div class="dashboard-heading"><div><span class="eyebrow">NOVA PROPOSTA</span><h1>Monte a proposta</h1></div><NuxtLink class="text-link" to="/dashboard">Cancelar</NuxtLink></div>
      <form class="editor-grid" @submit.prevent="save">
        <section class="card form-section">
          <h2>Cliente</h2>
          <div class="form-grid two">
            <label>Nome / empresa<input v-model="form.client_name" required placeholder="Cliente" /></label>
            <label>E-mail<input v-model="form.client_email" type="email" placeholder="cliente@email.com" /></label>
            <label>WhatsApp<input v-model="form.client_phone" placeholder="(11) 99999-9999" /></label>
            <label>Validade<input v-model="form.valid_until" type="date" /></label>
          </div>
        </section>
        <section class="card form-section">
          <h2>Proposta</h2>
          <label>Título<input v-model="form.title" required placeholder="Ex.: Instalação de ar-condicionado" /></label>
          <label>Apresentação<textarea v-model="form.introduction" rows="3" /></label>
        </section>
        <section class="card form-section">
          <div class="inline-title"><h2>Itens</h2><button type="button" class="text-link link-button" @click="addItem">+ Adicionar item</button></div>
          <div v-for="(item, index) in form.items" :key="index" class="item-row">
            <input v-model="item.description" required placeholder="Descrição do serviço" />
            <input v-model.number="item.quantity" required min="0.01" step="0.01" type="number" placeholder="Qtd." />
            <input v-model.number="item.unit_price" required min="0" step="0.01" type="number" placeholder="Valor unitário" />
            <button type="button" class="remove-button" @click="removeItem(index)">×</button>
          </div>
          <div class="totals"><span>Subtotal <strong>{{ money(subtotal) }}</strong></span><label>Desconto <input v-model.number="form.discount" min="0" step="0.01" type="number" /></label><span class="grand-total">Total <strong>{{ money(total) }}</strong></span></div>
        </section>
        <section class="card form-section">
          <h2>Condições</h2>
          <label>Pagamento<textarea v-model="form.payment_terms" rows="2" /></label>
          <label>Observações<textarea v-model="form.notes" rows="3" placeholder="Prazo de execução, garantia, inclusões e exclusões..." /></label>
        </section>
        <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
        <div class="editor-actions"><button class="btn btn-primary" :disabled="loading">{{ loading ? 'Salvando...' : 'Salvar proposta' }}</button></div>
      </form>
    </main>
  </div>
</template>

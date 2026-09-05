<script setup lang="ts">
const route = useRoute()
useSeoMeta({ title: 'Proposta comercial', description: 'Proposta comercial criada com OrçaFácil.' })
const loading = ref(true)
const proposal = ref<any>(null)
const errorMessage = ref('')
const responseName = ref('')
const responseEmail = ref('')
const responding = ref(false)
const responseDone = ref('')

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

async function load() {
  if (route.params.token === 'demo') {
    proposal.value = {
      company_name: 'Clima Perfeito Instalações', number: '#2026-014', client_name: 'Condomínio Jardim Azul',
      title: 'Instalação de ar-condicionado', introduction: 'Obrigado pela oportunidade. Segue nossa proposta conforme alinhado.',
      items: [{ description: 'Instalação split 12.000 BTUs', quantity: 1, unit_price: 850 }, { description: 'Materiais e acabamento', quantity: 1, unit_price: 320 }],
      subtotal: 1170, discount: 0, total: 1170, payment_terms: '50% na aprovação e 50% na conclusão.', notes: 'Prazo de execução: até 3 dias úteis.', status: 'sent', valid_until: '2026-09-15', branded: true
    }
    loading.value = false
    return
  }

  try {
    const result = await $fetch<any>(`/api/public/proposals/${route.params.token}`)
    proposal.value = result.proposal
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

      <section v-if="proposal.status === 'sent'" class="response-box">
        <h2>Responder proposta</h2><p>Informe seu nome e registre sua decisão.</p><div class="form-grid two"><label>Nome<input v-model="responseName" placeholder="Seu nome" /></label><label>E-mail (opcional)<input v-model="responseEmail" type="email" placeholder="seu@email.com" /></label></div><div class="response-actions"><button class="btn btn-primary" :disabled="responding" @click="respond('accepted')">Aceitar proposta</button><button class="btn btn-secondary" :disabled="responding" @click="respond('rejected')">Recusar</button></div><p class="fine-print">Este recurso registra o aceite comercial e seus metadados básicos. Não substitui assinatura eletrônica qualificada quando a operação exigir formalidade específica.</p>
      </section>
      <p v-if="responseDone" class="notice success">{{ responseDone }}</p><p v-else-if="errorMessage" class="notice error">{{ errorMessage }}</p>
      <footer v-if="proposal.branded !== false" class="powered-by">Proposta criada com <NuxtLink to="/">OrçaFácil</NuxtLink></footer>
    </article>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Painel' })

type Proposal = {
  id: string
  number: string
  client_name: string
  title: string
  status: string
  total: number
  created_at: string
}

const route = useRoute()
const { request } = useApi()
const loading = ref(true)
const proposals = ref<Proposal[]>([])
const profile = ref<any>(null)
const usage = ref<any>(null)
const errorMessage = ref('')
const billingLoading = ref(false)

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [list, me] = await Promise.all([
      request<{ proposals: Proposal[] }>('/api/proposals'),
      request<any>('/api/me')
    ])
    proposals.value = list.proposals
    profile.value = me.profile
    usage.value = me.usage

    if (route.query.billing === 'return' && profile.value?.subscription_id) {
      await syncBilling()
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Erro ao carregar o painel.'
  } finally {
    loading.value = false
  }
}

async function startCheckout() {
  billingLoading.value = true
  try {
    const result = await request<{ checkoutUrl: string }>('/api/billing/checkout', { method: 'POST' })
    window.location.href = result.checkoutUrl
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Não foi possível iniciar a assinatura.'
  } finally {
    billingLoading.value = false
  }
}

async function syncBilling() {
  try {
    await request('/api/billing/sync', { method: 'POST' })
    const me = await request<any>('/api/me')
    profile.value = me.profile
    usage.value = me.usage
  } catch {
    // O webhook também fará a sincronização; não bloqueamos a tela.
  }
}

onMounted(load)
</script>

<template>
  <div>
    <AppHeader authenticated />
    <main class="dashboard shell">
      <div class="dashboard-heading">
        <div>
          <span class="eyebrow">PAINEL</span>
          <h1>Suas propostas</h1>
          <p v-if="profile">{{ profile.company_name || 'Sua empresa' }} · Plano {{ profile.plan === 'pro' ? 'Pro' : 'Grátis' }}</p>
        </div>
        <NuxtLink class="btn btn-primary" to="/dashboard/propostas/nova">+ Nova proposta</NuxtLink>
      </div>

      <div v-if="profile?.plan !== 'pro' && usage" class="upgrade-banner card">
        <div>
          <strong>{{ usage.sentThisMonth }} de {{ usage.limit }} propostas enviadas este mês</strong>
          <span>Remova o limite e a marca OrçaFácil com o plano Pro.</span>
        </div>
        <button class="btn btn-dark" :disabled="billingLoading" @click="startCheckout">{{ billingLoading ? 'Abrindo...' : 'Assinar Pro · R$ 39,90/mês' }}</button>
      </div>

      <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
      <div v-if="loading" class="empty card">Carregando...</div>
      <div v-else-if="!proposals.length" class="empty card">
        <h3>Nenhuma proposta ainda</h3>
        <p>Crie sua primeira proposta e envie o link ao cliente.</p>
        <NuxtLink class="btn btn-primary" to="/dashboard/propostas/nova">Criar primeira proposta</NuxtLink>
      </div>
      <div v-else class="table-card card">
        <div class="table-head"><span>Proposta</span><span>Cliente</span><span>Status</span><span>Valor</span><span></span></div>
        <div v-for="proposal in proposals" :key="proposal.id" class="table-row">
          <div><strong>{{ proposal.number }}</strong><small>{{ proposal.title }}</small></div>
          <span>{{ proposal.client_name }}</span>
          <StatusBadge :status="proposal.status" />
          <strong>{{ money(proposal.total) }}</strong>
          <NuxtLink class="text-link" :to="`/dashboard/propostas/${proposal.id}`">Abrir →</NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

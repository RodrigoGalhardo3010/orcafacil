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

type PaidPlan = 'essencial' | 'pro'

const route = useRoute()
const router = useRouter()
const { request } = useApi()
const loading = ref(true)
const proposals = ref<Proposal[]>([])
const profile = ref<any>(null)
const usage = ref<any>(null)
const errorMessage = ref('')
const billingMessage = ref('')
const billingLoading = ref<PaidPlan | 'cancel' | ''>('')

const planName = computed(() => profile.value?.plan === 'pro' ? 'Pro' : profile.value?.plan === 'essencial' ? 'Essencial' : 'Grátis')
const isPaid = computed(() => profile.value?.plan === 'essencial' || profile.value?.plan === 'pro')

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

async function refreshAccount() {
  const me = await request<any>('/api/me')
  profile.value = me.profile
  usage.value = me.usage
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
      billingMessage.value = profile.value?.plan_status === 'authorized'
        ? `Pagamento confirmado. Seu plano ${planName.value} está ativo.`
        : 'O pagamento ainda está sendo confirmado. Atualizaremos seu plano automaticamente.'
      await router.replace({ query: {} })
    } else if (route.query.billing === 'confirmed') {
      billingMessage.value = `Pagamento confirmado. Seu plano ${planName.value} está ativo.`
      await router.replace({ query: {} })
    } else if (route.query.billing === 'pending') {
      billingMessage.value = 'O pagamento ainda está sendo confirmado. Atualizaremos seu plano automaticamente.'
      await router.replace({ query: {} })
    } else if (route.query.billing === 'error') {
      errorMessage.value = 'Não foi possível confirmar o pagamento agora. Tente atualizar a página em instantes.'
      await router.replace({ query: {} })
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Erro ao carregar o painel.'
  } finally {
    loading.value = false
  }
}

async function startCheckout(plan: PaidPlan) {
  billingLoading.value = plan
  errorMessage.value = ''
  billingMessage.value = ''
  try {
    const result = await request<{ checkoutUrl?: string, status?: string }>('/api/billing/checkout', { method: 'POST', body: { plan } })
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl
      return
    }
    await refreshAccount()
    billingMessage.value = `Plano ${planName.value} atualizado com sucesso.`
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Não foi possível iniciar a assinatura.'
  } finally {
    billingLoading.value = ''
  }
}

async function cancelBilling() {
  if (!window.confirm('Cancelar a assinatura e interromper as próximas cobranças?')) return
  billingLoading.value = 'cancel'
  errorMessage.value = ''
  billingMessage.value = ''
  try {
    await request('/api/billing/cancel', { method: 'POST' })
    await refreshAccount()
    billingMessage.value = 'Assinatura cancelada. Não haverá novas cobranças.'
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Não foi possível cancelar a assinatura.'
  } finally {
    billingLoading.value = ''
  }
}

async function syncBilling() {
  try {
    await request('/api/billing/sync', { method: 'POST' })
    await refreshAccount()
  } catch {
    // O webhook também sincroniza o pagamento; a tela continua disponível.
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
          <p v-if="profile">{{ profile.company_name || 'Sua empresa' }} · Plano {{ planName }}</p>
        </div>
        <NuxtLink class="btn btn-primary" to="/dashboard/propostas/nova">+ Nova proposta</NuxtLink>
      </div>

      <div v-if="profile && usage" class="upgrade-banner card">
        <div>
          <strong v-if="usage.limit === null">Propostas ilimitadas no plano Pro</strong>
          <strong v-else>{{ usage.sentThisMonth }} de {{ usage.limit }} propostas enviadas este mês</strong>
          <span v-if="profile.plan === 'free'">Escolha 25 envios por mês ou uso ilimitado.</span>
          <span v-else-if="profile.plan === 'essencial'">Seu plano inclui até 25 envios e remove a marca OrçaFácil.</span>
          <span v-else>Seu plano inclui envios ilimitados e remove a marca OrçaFácil.</span>
        </div>
        <div class="billing-actions">
          <template v-if="profile.plan === 'free'">
            <button class="btn btn-primary" :disabled="!!billingLoading" @click="startCheckout('essencial')">
              {{ billingLoading === 'essencial' ? 'Abrindo...' : 'Essencial · R$ 19,90' }}
            </button>
            <button class="btn btn-dark" :disabled="!!billingLoading" @click="startCheckout('pro')">
              {{ billingLoading === 'pro' ? 'Abrindo...' : 'Pro · R$ 39,90' }}
            </button>
          </template>
          <template v-else>
            <button v-if="profile.plan === 'essencial'" class="btn btn-dark" :disabled="!!billingLoading" @click="startCheckout('pro')">
              {{ billingLoading === 'pro' ? 'Atualizando...' : 'Mudar para Pro · R$ 39,90' }}
            </button>
            <button v-else class="btn btn-secondary" :disabled="!!billingLoading" @click="startCheckout('essencial')">
              {{ billingLoading === 'essencial' ? 'Atualizando...' : 'Mudar para Essencial' }}
            </button>
            <button v-if="isPaid && profile.plan_status === 'authorized'" class="link-button billing-cancel" :disabled="!!billingLoading" @click="cancelBilling">
              {{ billingLoading === 'cancel' ? 'Cancelando...' : 'Cancelar assinatura' }}
            </button>
          </template>
        </div>
      </div>

      <p v-if="billingMessage" class="notice success">{{ billingMessage }}</p>
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

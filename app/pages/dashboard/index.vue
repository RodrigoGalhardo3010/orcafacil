<script setup lang="ts">
import { billingOffer, BILLING_CYCLES, isBillingCycle, type BillingCycle } from '~~/shared/billing-catalog'
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
const cycle = ref<BillingCycle>(isBillingCycle(route.query.cycle) ? route.query.cycle : 'monthly')
const subscription = ref<any>(null)
const { request } = useApi()
const loading = ref(true)
const proposals = ref<Proposal[]>([])
const profile = ref<any>(null)
const usage = ref<any>(null)
const errorMessage = ref('')
const billingMessage = ref('')
const sentMessage = ref('')
const billingLoading = ref<PaidPlan | 'cancel' | ''>('')

const planName = computed(() => profile.value?.plan === 'pro' ? 'Pro' : profile.value?.plan === 'essencial' ? 'Essencial' : 'Grátis')
const isPaid = computed(() => profile.value?.plan === 'essencial' || profile.value?.plan === 'pro')

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

async function refreshAccount() {
  const me = await request<any>('/api/me')
  profile.value = me.profile
  subscription.value = me.subscription
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
    subscription.value = me.subscription
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

    if (route.query.sent) {
      if (route.query.sent === 'email') sentMessage.value = 'Proposta enviada com o PDF anexado e o link para aceite.'
      else if (route.query.sent === 'failed') errorMessage.value = `Proposta enviada, mas o e-mail não foi entregue (${route.query.reason || 'motivo desconhecido'}). Use o link para compartilhar.`
      else sentMessage.value = 'Proposta enviada com link de aceite e PDF para compartilhamento.'
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
    const result = await request<{ checkoutUrl?: string, status?: string }>('/api/billing/checkout', { method: 'POST', body: { plan, cycle: cycle.value } })
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
    billingMessage.value = 'Renovação cancelada. O acesso continua até o fim do período pago.'
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

      <template v-if="profile && !isPaid">
        <BillingCycleSelector v-model="cycle" :disabled="!!billingLoading" />
        <p>Cobrança integral a cada {{ BILLING_CYCLES[cycle].months }} {{ cycle === 'monthly' ? 'mês' : 'meses' }}, com renovação automática. Os limites de envio continuam mensais.</p>
      </template>
      <p v-if="subscription && isPaid">Assinatura {{ BILLING_CYCLES[subscription.billing_cycle as BillingCycle]?.name.toLowerCase() }} · {{ money(subscription.amount_cents / 100) }} por período.<br />Acesso até {{ new Date(profile.paid_through).toLocaleDateString('pt-BR') }}. {{ subscription.status === 'cancelled' ? 'Renovação cancelada.' : 'Renovação automática.' }}</p>
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
              {{ billingLoading === 'essencial' ? 'Abrindo...' : `Essencial · ${money(billingOffer('essencial', cycle).amountCents / 100)}` }}
            </button>
            <button class="btn btn-dark" :disabled="!!billingLoading" @click="startCheckout('pro')">
              {{ billingLoading === 'pro' ? 'Abrindo...' : `Pro · ${money(billingOffer('pro', cycle).amountCents / 100)}` }}
            </button>
          </template>
          <template v-else>
            <span>Para mudar de plano ou período, cancele a renovação e escolha a nova opção ao fim do acesso.</span>
            <button v-if="['authorized','paused'].includes(profile.plan_status)" class="link-button billing-cancel" :disabled="!!billingLoading" @click="cancelBilling">
              {{ billingLoading === 'cancel' ? 'Cancelando...' : 'Cancelar renovação' }}
            </button>
          </template>
        </div>
      </div>

      <p v-if="sentMessage" class="notice success">{{ sentMessage }}</p>
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

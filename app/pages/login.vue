<script setup lang="ts">
import { isBillingCycle } from '~~/shared/billing-catalog'
const route = useRoute()
const supabase = useSupabase()
const mode = ref(route.query.mode === 'signup' ? 'signup' : 'login')
const name = ref('')
const company = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const message = ref('')
const errorMessage = ref('')

function dashboardTarget() {
  return route.query.plan === 'essencial' || route.query.plan === 'pro'
    ? `/dashboard?plan=${route.query.plan}&cycle=${isBillingCycle(route.query.cycle) ? route.query.cycle : 'monthly'}`
    : '/dashboard'
}

async function submit() {
  loading.value = true
  message.value = ''
  errorMessage.value = ''

  try {
    if (mode.value === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            full_name: name.value,
            company_name: company.value
          }
        }
      })
      if (error) throw error
      if (data.session) await navigateTo(dashboardTarget())
      else message.value = 'Conta criada! Enviamos um link de confirmação para o seu e-mail. Não achou? Confira a pasta de spam ou lixo eletrônico.'
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (error) throw error
      await navigateTo(dashboardTarget())
    }
  } catch (error: any) {
    errorMessage.value = error?.message || 'Não foi possível concluir. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppHeader />
    <main class="auth-page shell">
      <section class="auth-card card">
        <span class="eyebrow">{{ mode === 'signup' ? 'COMECE GRÁTIS' : 'BEM-VINDO DE VOLTA' }}</span>
        <h1>{{ mode === 'signup' ? 'Crie sua conta' : 'Entre no OrçaFácil' }}</h1>
        <p>{{ mode === 'signup' ? 'Envie até 3 propostas por mês sem pagar.' : 'Acesse suas propostas e acompanhe seus clientes.' }}</p>

        <form class="form-stack" @submit.prevent="submit">
          <template v-if="mode === 'signup'">
            <label>Seu nome<input v-model="name" required autocomplete="name" placeholder="Seu nome" /></label>
            <label>Empresa<input v-model="company" required autocomplete="organization" placeholder="Nome da empresa" /></label>
          </template>
          <label>E-mail<input v-model="email" type="email" required autocomplete="email" placeholder="voce@empresa.com.br" /></label>
          <label>Senha<input v-model="password" type="password" minlength="8" required autocomplete="current-password" placeholder="Mínimo 8 caracteres" /></label>
          <button class="btn btn-primary full" :disabled="loading">{{ loading ? 'Aguarde...' : (mode === 'signup' ? 'Criar conta' : 'Entrar') }}</button>
        </form>
        <p v-if="message" class="notice success">{{ message }}</p>
        <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
        <div class="auth-links">
          <NuxtLink v-if="mode === 'login'" class="link-button switch" to="/recuperar-senha">Esqueci minha senha</NuxtLink>
          <button class="link-button switch" @click="mode = mode === 'login' ? 'signup' : 'login'">
            {{ mode === 'login' ? 'Ainda não tem conta? Criar grátis' : 'Já tenho conta' }}
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

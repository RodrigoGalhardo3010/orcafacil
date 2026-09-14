<script setup lang="ts">
import { isBillingCycle } from '~~/shared/billing-catalog'
const route = useRoute()
const supabase = useSupabase()
const config = useRuntimeConfig()
const mode = ref(route.query.mode === 'signup' ? 'signup' : 'login')
const googleClientId = String(config.public.googleClientId || '')
const googleRedirectEnabled = Boolean(config.public.googleAuthEnabled)
const googleEnabled = computed(() => Boolean(googleClientId) || googleRedirectEnabled)
const googleButtonEl = ref<HTMLElement | null>(null)
const name = ref('')
const company = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const message = ref('')
const errorMessage = ref('')

function dashboardTarget() {
  return route.query.plan === 'essencial' || route.query.plan === 'pro'
    ? `/dashboard?plan=${route.query.plan}&cycle=${isBillingCycle(route.query.cycle) ? route.query.cycle : 'monthly'}`
    : '/dashboard'
}

// --- Login com Google no próprio domínio (Google Identity Services + ID token) ---
// Assim a tela do Google mostra o nosso domínio, e não o <projeto>.supabase.co.
function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    const w = window as any
    if (w.google?.accounts?.id) return resolve()
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar o Google.')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar o Google.'))
    document.head.appendChild(script)
  })
}

async function handleGoogleCredential(response: any) {
  loading.value = true
  errorMessage.value = ''
  try {
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: response?.credential })
    if (error) throw error
    await navigateTo(dashboardTarget())
  } catch (error: any) {
    errorMessage.value = error?.message || 'Não foi possível entrar com o Google.'
  } finally {
    loading.value = false
  }
}

async function mountGoogleButton() {
  if (!googleClientId || !googleButtonEl.value) return
  try {
    await loadGoogleScript()
    const g = (window as any).google
    const width = Math.min(400, Math.max(200, googleButtonEl.value.clientWidth || 320))
    g.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
      use_fedcm_for_prompt: true
    })
    g.accounts.id.renderButton(googleButtonEl.value, {
      type: 'standard', theme: 'filled_black', size: 'large', text: 'continue_with',
      shape: 'rectangular', logo_alignment: 'left', width
    })
  } catch (error: any) {
    errorMessage.value = error?.message || 'Não foi possível carregar o botão do Google.'
  }
}

// Fluxo antigo (redireciona pelo Supabase) — usado só como reserva.
async function loginWithGoogleRedirect() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) throw error
  } catch (error: any) {
    errorMessage.value = error?.message || 'Não foi possível entrar com o Google.'
    loading.value = false
  }
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

onMounted(mountGoogleButton)
</script>

<template>
  <div>
    <AppHeader />
    <main class="auth-page shell">
      <section class="auth-card card">
        <span class="eyebrow">{{ mode === 'signup' ? 'COMECE GRÁTIS' : 'BEM-VINDO DE VOLTA' }}</span>
        <h1>{{ mode === 'signup' ? 'Crie sua conta' : 'Entre no OrçaFácil' }}</h1>
        <p>{{ mode === 'signup' ? 'Envie até 3 propostas por mês sem pagar.' : 'Acesse suas propostas e acompanhe seus clientes.' }}</p>

        <template v-if="googleEnabled">
          <div v-if="googleClientId" ref="googleButtonEl" class="google-slot"></div>
          <button v-else type="button" class="btn btn-secondary full" :disabled="loading" @click="loginWithGoogleRedirect">Continuar com Google</button>
          <div class="auth-divider"><span>ou com e-mail</span></div>
        </template>

        <form class="form-stack" @submit.prevent="submit">
          <template v-if="mode === 'signup'">
            <label>Seu nome<input v-model="name" required autocomplete="name" placeholder="Seu nome" /></label>
            <label>Empresa<input v-model="company" required autocomplete="organization" placeholder="Nome da empresa" /></label>
          </template>
          <label>E-mail<input v-model="email" type="email" required autocomplete="email" placeholder="voce@empresa.com.br" /></label>
          <label>Senha
            <span class="password-row">
              <input v-model="password" :type="showPassword ? 'text' : 'password'" minlength="8" required :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" placeholder="Mínimo 8 caracteres" />
              <button type="button" class="password-toggle" @click="showPassword = !showPassword">{{ showPassword ? 'Ocultar' : 'Mostrar' }}</button>
            </span>
          </label>
          <button class="btn btn-primary full" :disabled="loading">{{ loading ? 'Aguarde...' : (mode === 'signup' ? 'Criar conta' : 'Entrar') }}</button>
          <p v-if="mode === 'signup'" class="fine-print">Sem cartão de crédito · Funciona no celular · Cancele quando quiser.</p>
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

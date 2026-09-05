<script setup lang="ts">
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
      if (data.session) await navigateTo('/dashboard')
      else message.value = 'Conta criada. Confira seu e-mail para confirmar o cadastro.'
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (error) throw error
      await navigateTo('/dashboard')
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
        <button class="link-button switch" @click="mode = mode === 'login' ? 'signup' : 'login'">
          {{ mode === 'login' ? 'Ainda não tem conta? Criar grátis' : 'Já tenho conta' }}
        </button>
      </section>
    </main>
  </div>
</template>

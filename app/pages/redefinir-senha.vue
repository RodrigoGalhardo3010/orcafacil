<script setup lang="ts">
const supabase = useSupabase()
useSeoMeta({ title: 'Criar nova senha', description: 'Defina uma nova senha para acessar o OrçaFácil.' })

const initialHash = import.meta.client ? window.location.hash : ''
const hashParams = new URLSearchParams(initialHash.replace(/^#/, ''))
const linkError = hashParams.get('error_description')?.replace(/\+/g, ' ')
  || (hashParams.get('error') ? 'Este link de recuperação é inválido ou expirou.' : '')

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const checking = ref(true)
const ready = ref(false)
const message = ref('')
const errorMessage = ref('')

async function waitForRecoverySession(timeoutMs = 6000) {
  let recovered = false
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') recovered = true
  })
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const { data } = await supabase.auth.getSession()
    if (data.session || recovered) break
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  subscription.unsubscribe()
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session) || recovered
}

onMounted(async () => {
  errorMessage.value = linkError
  if (!linkError) ready.value = await waitForRecoverySession()
  if (!ready.value && !errorMessage.value) errorMessage.value = 'Este link de recuperação é inválido ou expirou. Solicite um novo link.'
  checking.value = false
})

async function submit() {
  if (password.value.length < 8) {
    errorMessage.value = 'A senha precisa ter pelo menos 8 caracteres.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As duas senhas não conferem.'
    return
  }
  loading.value = true
  errorMessage.value = ''
  message.value = ''
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) throw error
    if (import.meta.client) window.history.replaceState(null, '', window.location.pathname)
    message.value = 'Senha alterada com sucesso! Entrando na sua conta...'
    setTimeout(() => { navigateTo('/dashboard') }, 1200)
  } catch (error: any) {
    errorMessage.value = error?.message || 'Não foi possível alterar a senha. Solicite um novo link.'
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
        <span class="eyebrow">NOVA SENHA</span>
        <h1>Criar nova senha</h1>

        <p v-if="checking" class="fine-print">Verificando o link de recuperação...</p>

        <template v-else-if="ready">
          <p>Escolha uma nova senha para acessar sua conta.</p>
          <form class="form-stack" @submit.prevent="submit">
            <label>Nova senha<input v-model="password" type="password" minlength="8" required autocomplete="new-password" placeholder="Mínimo 8 caracteres" /></label>
            <label>Confirme a nova senha<input v-model="confirmPassword" type="password" minlength="8" required autocomplete="new-password" placeholder="Repita a senha" /></label>
            <button class="btn btn-primary full" :disabled="loading">{{ loading ? 'Salvando...' : 'Salvar nova senha' }}</button>
          </form>
        </template>

        <template v-else>
          <p>Não conseguimos validar este link. Ele pode ter expirado ou já ter sido usado.</p>
          <NuxtLink class="btn btn-primary full" to="/recuperar-senha">Solicitar novo link</NuxtLink>
        </template>

        <p v-if="message" class="notice success">{{ message }}</p>
        <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
        <NuxtLink class="link-button switch" to="/login">← Voltar para o login</NuxtLink>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabase()
useSeoMeta({ title: 'Recuperar senha', description: 'Receba um link para criar uma nova senha no OrçaFácil.' })
const email = ref('')
const loading = ref(false)
const message = ref('')
const errorMessage = ref('')

async function submit() {
  loading.value = true
  message.value = ''
  errorMessage.value = ''
  try {
    const redirectTo = `${window.location.origin}/redefinir-senha`
    const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), { redirectTo })
    if (error) throw error
    message.value = 'Se existir uma conta com esse e-mail, enviamos um link para você criar uma nova senha. Confira a caixa de entrada e também o spam.'
  } catch (error: any) {
    errorMessage.value = error?.message || 'Não foi possível enviar o link agora. Tente novamente em instantes.'
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
        <span class="eyebrow">RECUPERAR ACESSO</span>
        <h1>Esqueci minha senha</h1>
        <p>Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.</p>

        <form class="form-stack" @submit.prevent="submit">
          <label>E-mail<input v-model="email" type="email" required autocomplete="email" placeholder="voce@empresa.com.br" /></label>
          <button class="btn btn-primary full" :disabled="loading">{{ loading ? 'Enviando...' : 'Enviar link de recuperação' }}</button>
        </form>
        <p v-if="message" class="notice success">{{ message }}</p>
        <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
        <NuxtLink class="link-button switch" to="/login">← Voltar para o login</NuxtLink>
      </section>
    </main>
  </div>
</template>

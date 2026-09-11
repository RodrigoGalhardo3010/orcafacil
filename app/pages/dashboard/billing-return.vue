<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Confirmando pagamento' })

const { request } = useApi()
const errorMessage = ref('')

onMounted(async () => {
  try {
    const result = await request<{ status?: string }>('/api/billing/sync', { method: 'POST' })
    const billing = result.status === 'authorized' ? 'confirmed' : 'pending'
    await navigateTo({ path: '/dashboard', query: { billing } }, { replace: true })
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Não foi possível confirmar o pagamento agora.'
  }
})
</script>

<template>
  <div>
    <AppHeader authenticated />
    <main class="dashboard shell">
      <div class="empty card">
        <h1>Confirmando pagamento</h1>
        <p v-if="!errorMessage">Aguarde enquanto atualizamos seu plano.</p>
        <p v-else class="notice error">{{ errorMessage }}</p>
      </div>
    </main>
  </div>
</template>

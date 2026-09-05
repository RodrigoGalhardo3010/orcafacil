<script setup lang="ts">
const props = defineProps<{ authenticated?: boolean }>()
const supabase = import.meta.client ? useSupabase() : null

async function logout() {
  if (!supabase) return
  await supabase.auth.signOut()
  await navigateTo('/')
}
</script>

<template>
  <header class="topbar">
    <NuxtLink class="brand" to="/">
      <span class="brand-mark">O</span>
      <span>OrçaFácil</span>
    </NuxtLink>
    <nav class="topbar-nav">
      <NuxtLink to="/precos">Preços</NuxtLink>
      <NuxtLink v-if="!props.authenticated" class="btn btn-small btn-ghost" to="/login">Entrar</NuxtLink>
      <NuxtLink v-if="props.authenticated" class="btn btn-small btn-ghost" to="/dashboard">Painel</NuxtLink>
      <button v-if="props.authenticated" class="link-button" @click="logout">Sair</button>
    </nav>
  </header>
</template>

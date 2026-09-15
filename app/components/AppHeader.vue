<script setup lang="ts">
const props = defineProps<{ authenticated?: boolean }>()
const supabase = import.meta.client ? useSupabase() : null
const loggedIn = ref(false)

function refreshAuth() {
  if (!supabase) return
  supabase.auth.getSession().then(({ data }) => {
    loggedIn.value = Boolean(data.session)
  })
}

async function logout() {
  if (!supabase) return
  await supabase.auth.signOut()
  await navigateTo('/')
}

onMounted(() => {
  refreshAuth()
  supabase?.auth.onAuthStateChange((_event, session) => {
    loggedIn.value = Boolean(session)
  })
})

const showLoggedIn = computed(() => props.authenticated || loggedIn.value)
</script>

<template>
  <header class="topbar">
    <NuxtLink class="brand" to="/">
      <span class="brand-mark">O</span>
      <span>OrçaFácil</span>
    </NuxtLink>
    <nav class="topbar-nav">
      <NuxtLink to="/precos">Preços</NuxtLink>
      <NuxtLink v-if="!showLoggedIn" class="btn btn-small btn-ghost" to="/login">Entrar</NuxtLink>
      <NuxtLink v-if="showLoggedIn" class="btn btn-small btn-ghost" to="/dashboard">Painel</NuxtLink>
      <button v-if="showLoggedIn" class="link-button" @click="logout">Sair</button>
    </nav>
  </header>
</template>

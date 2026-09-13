<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const cfBeaconToken = String(runtimeConfig.public.cfBeaconToken || '')

// Cloudflare Web Analytics (sem cookies). O rastreio de SPA é automático.
// O token é público (vai no HTML) e vem de NUXT_PUBLIC_CF_BEACON_TOKEN.
if (cfBeaconToken) {
  useHead({
    script: [
      {
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        type: 'module',
        'data-cf-beacon': JSON.stringify({ token: cfBeaconToken })
      }
    ]
  })
}
</script>

<template>
  <NuxtPage />
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()
const labels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  accepted: 'Aceita',
  rejected: 'Recusada',
  expired: 'Expirada'
}
</script>

<template>
  <span class="status" :class="`status-${props.status}`">{{ labels[props.status] || props.status }}</span>
</template>

<script setup lang="ts">
import { BILLING_CYCLES, type BillingCycle } from '~~/shared/billing-catalog'
const model = defineModel<BillingCycle>({ default: 'monthly' })
defineProps<{ disabled?: boolean }>()
</script>
<template>
  <fieldset class="billing-cycle-selector" :disabled="disabled">
    <legend>Período da assinatura</legend>
    <label v-for="(cycle, key) in BILLING_CYCLES" :key="key" :class="{ selected: model === key }">
      <input v-model="model" type="radio" :value="key" name="billing-cycle" />
      {{ cycle.name }} <small v-if="cycle.discount">−{{ cycle.discount }}%</small>
    </label>
  </fieldset>
</template>
<style scoped>
.billing-cycle-selector{border:0;padding:0;margin:1.5rem 0;display:flex;flex-wrap:wrap;gap:.65rem}
legend{font-size:.85rem;color:var(--muted);margin-bottom:.75rem}
label{cursor:pointer;border:1px solid #39433f;border-radius:12px;padding:.8rem 1rem;display:flex;align-items:center;gap:.5rem}
label.selected{border-color:#37df9b;background:#14352b;color:#f2fff9}
input{accent-color:#37df9b;width:1rem;height:1rem}
small{color:#69edb4;font-weight:700}
</style>

export const BILLING_CYCLES = {
  monthly: { name: 'Mensal', months: 1, discount: 0 },
  quarterly: { name: 'Trimestral', months: 3, discount: 30 },
  annual: { name: 'Anual', months: 12, discount: 50 }
} as const
export type BillingCycle = keyof typeof BILLING_CYCLES
export const BILLING_CATALOG_VERSION = '2026-09-v1'
export const BILLING_PRICES = {
  essencial: { monthly: 1990, quarterly: 4179, annual: 11940 },
  pro: { monthly: 3990, quarterly: 8379, annual: 23940 }
} as const
export function isBillingCycle(value: unknown): value is BillingCycle {
  return value === 'monthly' || value === 'quarterly' || value === 'annual'
}
export function billingOffer(plan: keyof typeof BILLING_PRICES, cycle: BillingCycle) {
  return { ...BILLING_CYCLES[cycle], cycle, plan, amountCents: BILLING_PRICES[plan][cycle], version: BILLING_CATALOG_VERSION }
}

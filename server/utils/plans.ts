export const PLAN_DEFINITIONS = {
  free: {
    id: 'free',
    name: 'Grátis',
    monthlyPrice: 0,
    monthlyProposalLimit: 3
  },
  essencial: {
    id: 'essencial',
    name: 'Essencial',
    monthlyPrice: 19.90,
    monthlyProposalLimit: 25
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 39.90,
    monthlyProposalLimit: null
  }
} as const

export type PlanId = keyof typeof PLAN_DEFINITIONS
export type PaidPlanId = Exclude<PlanId, 'free'>

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in PLAN_DEFINITIONS
}

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return value === 'essencial' || value === 'pro'
}

export function getPlan(value: unknown) {
  return PLAN_DEFINITIONS[isPlanId(value) ? value : 'free']
}

export function paidPlanFromAmount(value: unknown): PaidPlanId | null {
  const amount = Number(value)
  if (Math.abs(amount - PLAN_DEFINITIONS.essencial.monthlyPrice) < 0.01) return 'essencial'
  if (Math.abs(amount - PLAN_DEFINITIONS.pro.monthlyPrice) < 0.01) return 'pro'
  return null
}

export function planRemovesBranding(value: unknown) {
  return isPaidPlanId(value)
}

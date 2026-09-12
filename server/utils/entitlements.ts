// A cached plan never grants access beyond its paid period.
// Admin accounts are always unlimited, regardless of billing state.
export function effectivePlan(profile: any, now = Date.now()) {
  if (profile?.is_admin === true) return 'pro'
  if (!isPaidPlanId(profile?.plan)) return 'free'
  return Date.parse(profile?.paid_through || '') > now ? profile.plan : 'free'
}

// A cached plan never grants access beyond its paid period.
export function effectivePlan(profile: any, now = Date.now()) {
  if (!isPaidPlanId(profile?.plan)) return 'free'
  return Date.parse(profile?.paid_through || '') > now ? profile.plan : 'free'
}

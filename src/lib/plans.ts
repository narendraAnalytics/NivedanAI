export type PlanKey = 'free' | 'plus' | 'pro'

export const PLAN_LIMITS: Record<PlanKey, {
  proposalsPerMonth: number  // Infinity = unlimited
  kbDocsPerMonth: number
  label: string
  badgeBg: string
  badgeColor: string
}> = {
  free: {
    proposalsPerMonth: 1,
    kbDocsPerMonth: 1,
    label: 'Free',
    badgeBg: 'rgba(212,168,79,0.18)',
    badgeColor: '#B88A2F',
  },
  plus: {
    proposalsPerMonth: 5,
    kbDocsPerMonth: 10,
    label: 'Plus',
    badgeBg: 'rgba(47,93,80,0.15)',
    badgeColor: '#2F5D50',
  },
  pro: {
    proposalsPerMonth: Infinity,
    kbDocsPerMonth: Infinity,
    label: 'Pro',
    badgeBg: 'rgba(47,93,80,0.90)',
    badgeColor: '#F7E7C1',
  },
}

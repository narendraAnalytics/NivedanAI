import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { PLAN_LIMITS, type PlanKey } from '@/lib/plans'

export async function GET() {
  try {
    const user = await getOrCreateUser()
    const limits = PLAN_LIMITS[user.plan as PlanKey]
    return NextResponse.json({ plan: user.plan, ...limits })
  } catch {
    return NextResponse.json({ plan: 'free', ...PLAN_LIMITS.free }, { status: 200 })
  }
}

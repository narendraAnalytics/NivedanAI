import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { db } from '@/db'
import { rfpJobs } from '@/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

export async function GET() {
  const user = await getOrCreateUser()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rfpJobs)
    .where(and(
      eq(rfpJobs.userId, user.id),
      gte(rfpJobs.createdAt, startOfMonth),
    ))

  return NextResponse.json({ jobsThisMonth: row?.count ?? 0 })
}

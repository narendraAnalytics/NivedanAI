import { NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/db'
import { proposals, rfpJobs } from '@/db/schema'
import { getOrCreateUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getOrCreateUser()

    const rows = await db
      .select({
        jobId: rfpJobs.id,
        clientName: rfpJobs.clientName,
        rfpTitle: rfpJobs.rfpTitle,
        jobStatus: rfpJobs.status,
        qualityScore: proposals.qualityScore,
        createdAt: proposals.createdAt,
        isApproved: proposals.isApproved,
      })
      .from(proposals)
      .innerJoin(rfpJobs, eq(rfpJobs.id, proposals.rfpJobId))
      .where(eq(rfpJobs.userId, user.id))
      .orderBy(desc(proposals.createdAt))
      .limit(5)

    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

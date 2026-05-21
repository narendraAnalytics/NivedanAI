import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { db } from '@/db'
import { rfpJobs, rfpDocuments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await getOrCreateUser()
  const { jobId } = await params

  const [job] = await db
    .select({
      status: rfpJobs.status,
      currentAgent: rfpJobs.currentAgent,
      currentActivity: rfpJobs.currentActivity,
      errorMessage: rfpJobs.errorMessage,
      completedAt: rfpJobs.completedAt,
      clientName: rfpJobs.clientName,
      recipientEmail: rfpJobs.recipientEmail,
      userId: rfpJobs.userId,
      fileName: rfpDocuments.fileName,
    })
    .from(rfpJobs)
    .leftJoin(rfpDocuments, eq(rfpDocuments.rfpJobId, rfpJobs.id))
    .where(eq(rfpJobs.id, jobId))
    .limit(1)

  if (!job || job.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    status: job.status,
    currentAgent: job.currentAgent,
    currentActivity: job.currentActivity,
    errorMessage: job.errorMessage,
    completedAt: job.completedAt,
    clientName: job.clientName,
    recipientEmail: job.recipientEmail,
    fileName: job.fileName,
  })
}

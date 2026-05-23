import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { proposals, rfpJobs, proposalExports } from '@/db/schema'
import { getOrCreateUser } from '@/lib/auth'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getOrCreateUser()
    const { jobId } = await params

    const [row] = await db
      .select()
      .from(proposals)
      .innerJoin(rfpJobs, eq(rfpJobs.id, proposals.rfpJobId))
      .where(and(eq(proposals.rfpJobId, jobId), eq(rfpJobs.userId, user.id)))
      .limit(1)

    if (!row) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const [exportRow] = await db
      .select({ pdfUrl: proposalExports.pdfUrl, fileName: proposalExports.fileName })
      .from(proposalExports)
      .where(eq(proposalExports.proposalId, row.proposals.id))
      .limit(1)

    return NextResponse.json({
      ...row.proposals,
      rfpTitle: row.rfp_jobs.rfpTitle,
      clientName: row.rfp_jobs.clientName,
      jobStatus: row.rfp_jobs.status,
      pdfUrl: exportRow?.pdfUrl ?? null,
      pdfFileName: exportRow?.fileName ?? null,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

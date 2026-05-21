import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { proposals, hitlReviews } from '@/db/schema'
import { inngest } from '@/inngest/client'
import { getOrCreateUser } from '@/lib/auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getOrCreateUser()

    const { jobId } = await params

    const body = await req.json() as { flaggedSections?: string[]; feedbackText?: string }
    const flaggedSections: string[] = Array.isArray(body.flaggedSections) ? body.flaggedSections : []
    const feedbackText: string = typeof body.feedbackText === 'string' ? body.feedbackText : ''

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.rfpJobId, jobId))
      .limit(1)

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    await db.insert(hitlReviews).values({
      proposalId: proposal.id,
      round: proposal.version,
      status: 'changes_requested',
      flaggedSections,
      feedbackText,
      reviewedAt: new Date(),
    })

    await db
      .update(proposals)
      .set({ version: proposal.version + 1 })
      .where(eq(proposals.id, proposal.id))

    await inngest.send({
      name: 'nivedan/hitl.changes.requested',
      data: {
        jobId,
        proposalId: proposal.id,
        flaggedSections,
        feedbackText,
        userId: user.id,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

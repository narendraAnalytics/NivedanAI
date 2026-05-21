import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { proposals, hitlReviews } from '@/db/schema'
import { inngest } from '@/inngest/client'
import { getOrCreateUser } from '@/lib/auth'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    await getOrCreateUser()

    const { jobId } = await params

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
      status: 'approved',
      reviewedAt: new Date(),
    })

    await db.update(proposals).set({ isApproved: true }).where(eq(proposals.id, proposal.id))

    await inngest.send({
      name: 'nivedan/hitl.approved',
      data: { jobId, proposalId: proposal.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

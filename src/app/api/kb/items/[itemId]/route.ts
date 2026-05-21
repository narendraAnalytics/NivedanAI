import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { knowledgeBaseItems, companyProfiles } from '@/db/schema'
import { getOrCreateUser } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await getOrCreateUser()
  const { itemId } = await params

  const [profile] = await db
    .select({ id: companyProfiles.id })
    .from(companyProfiles)
    .where(eq(companyProfiles.userId, user.id))
    .limit(1)

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db
    .delete(knowledgeBaseItems)
    .where(
      and(
        eq(knowledgeBaseItems.id, itemId),
        eq(knowledgeBaseItems.companyProfileId, profile.id)
      )
    )

  return NextResponse.json({ ok: true })
}

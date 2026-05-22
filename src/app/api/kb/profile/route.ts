import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { companyProfiles } from '@/db/schema'
import { getOrCreateUser } from '@/lib/auth'

async function getOrCreateProfile(userId: string) {
  const [existing] = await db
    .select()
    .from(companyProfiles)
    .where(eq(companyProfiles.userId, userId))
    .limit(1)
  if (existing) return existing
  const [created] = await db
    .insert(companyProfiles)
    .values({ userId, companyName: 'My Company' })
    .returning()
  return created
}

export async function GET() {
  try {
    const user = await getOrCreateUser()
    const profile = await getOrCreateProfile(user.id)
    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json()
    const allowed = ['companyName', 'industry', 'website', 'tagline'] as const
    const updates: Partial<Record<typeof allowed[number], string>> = {}
    for (const key of allowed) {
      if (typeof body[key] === 'string') updates[key] = body[key]
    }
    const [updated] = await db
      .update(companyProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyProfiles.userId, user.id))
      .returning()
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

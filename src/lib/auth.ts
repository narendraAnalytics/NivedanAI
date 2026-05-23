import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getOrCreateUser() {
  const { userId, has } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Lazy sync — derive plan from Clerk billing on every call, no webhooks needed
  const clerkPlan = has({ plan: 'pro' })  ? 'pro'
                  : has({ plan: 'plus' }) ? 'plus'
                  : 'free'

  const [existing] = await db.select().from(users).where(eq(users.id, userId))

  if (!existing) {
    const clerkUser = await currentUser()
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? '',
        fullName: clerkUser?.fullName ?? null,
        avatarUrl: clerkUser?.imageUrl ?? null,
        plan: clerkPlan,
      })
      .returning()
    return newUser
  }

  if (existing.plan !== clerkPlan) {
    const [updated] = await db
      .update(users)
      .set({ plan: clerkPlan })
      .where(eq(users.id, userId))
      .returning()
    return updated
  }

  return existing
}

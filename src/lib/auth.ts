import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getOrCreateUser() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const [existing] = await db.select().from(users).where(eq(users.id, userId))
  if (existing) return existing

  const clerkUser = await currentUser()

  const [newUser] = await db
    .insert(users)
    .values({
      id: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? '',
      fullName: clerkUser?.fullName ?? null,
      avatarUrl: clerkUser?.imageUrl ?? null,
      plan: 'free',
    })
    .returning()
  return newUser
}

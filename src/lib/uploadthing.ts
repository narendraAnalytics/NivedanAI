import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { rfpJobs, rfpDocuments, companyProfiles } from '@/db/schema'
import { inngest } from '@/inngest/client'
import { getOrCreateUser } from '@/lib/auth'

const f = createUploadthing()

async function getOrCreateProfile(userId: string) {
  const [existing] = await db
    .select({ id: companyProfiles.id })
    .from(companyProfiles)
    .where(eq(companyProfiles.userId, userId))
    .limit(1)
  if (existing) return existing
  const [created] = await db
    .insert(companyProfiles)
    .values({ userId, companyName: 'My Company' })
    .returning({ id: companyProfiles.id })
  return created
}

export const ourFileRouter = {
  rfpDocument: f({ pdf: { maxFileSize: '32MB', maxFileCount: 1 } })
    .input(z.object({ recipientEmail: z.string().optional() }))
    .middleware(async ({ input }) => {
      const user = await getOrCreateUser()
      const profile = await getOrCreateProfile(user.id)
      return { userId: user.id, companyProfileId: profile.id, recipientEmail: input?.recipientEmail ?? null }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const [job] = await db
        .insert(rfpJobs)
        .values({
          userId: metadata.userId,
          status: 'pending',
          startedAt: new Date(),
          recipientEmail: metadata.recipientEmail,
        })
        .returning({ id: rfpJobs.id })

      await db.insert(rfpDocuments).values({
        rfpJobId: job.id,
        fileName: file.name,
        fileUrl: file.ufsUrl,
        fileSizeBytes: file.size,
      })

      await inngest.send({
        name: 'nivedan/rfp.submitted',
        data: {
          jobId: job.id,
          userId: metadata.userId,
          rfpDocumentUrl: file.ufsUrl,
          companyProfileId: metadata.companyProfileId,
          recipientEmail: metadata.recipientEmail ?? undefined,
        },
      })

      return { jobId: job.id }
    }),

  kbDocument: f({ pdf: { maxFileSize: '16MB', maxFileCount: 1 } })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { fileUrl: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

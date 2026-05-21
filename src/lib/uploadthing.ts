import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { rfpJobs, rfpDocuments, companyProfiles } from '@/db/schema'
import { inngest } from '@/inngest/client'
import { getOrCreateUser } from '@/lib/auth'

const f = createUploadthing()

export const ourFileRouter = {
  rfpDocument: f({ pdf: { maxFileSize: '32MB', maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getOrCreateUser()
      const [profile] = await db
        .select({ id: companyProfiles.id })
        .from(companyProfiles)
        .where(eq(companyProfiles.userId, user.id))
        .limit(1)
      return { userId: user.id, companyProfileId: profile?.id ?? '' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const [job] = await db
        .insert(rfpJobs)
        .values({
          userId: metadata.userId,
          status: 'pending',
          startedAt: new Date(),
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
        },
      })

      return { jobId: job.id }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

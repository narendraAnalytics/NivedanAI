import { pgTable, text, uuid, timestamp, integer, boolean, numeric } from 'drizzle-orm/pg-core'
import { rfpJobs } from './jobs'

export const proposals = pgTable('proposals', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfpJobId: uuid('rfp_job_id').notNull().unique().references(() => rfpJobs.id, { onDelete: 'cascade' }),
  version: integer('version').default(1).notNull(),
  executiveSummary: text('executive_summary'),
  understandingOfRequirements: text('understanding_of_requirements'),
  proposedSolution: text('proposed_solution'),
  technicalApproach: text('technical_approach'),
  caseStudies: text('case_studies'),
  teamAndExpertise: text('team_and_expertise'),
  projectTimeline: text('project_timeline'),
  pricingStructure: text('pricing_structure'),
  qualityReviewNotes: text('quality_review_notes'),
  qualityScore: numeric('quality_score', { precision: 3, scale: 2 }),
  isApproved: boolean('is_approved').default(false).notNull(),
  wordCount: integer('word_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const proposalExports = pgTable('proposal_exports', {
  id: uuid('id').defaultRandom().primaryKey(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id, { onDelete: 'cascade' }),
  version: integer('version').default(1).notNull(),
  pdfUrl: text('pdf_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  emailSentTo: text('email_sent_to'),
  emailSentAt: timestamp('email_sent_at'),
  resendMessageId: text('resend_message_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const hitlReviews = pgTable('hitl_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id, { onDelete: 'cascade' }),
  round: integer('round').default(1).notNull(),
  status: text('status').default('pending').notNull(), // pending | approved | changes_requested
  flaggedSections: text('flagged_sections').array(),
  feedbackText: text('feedback_text'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

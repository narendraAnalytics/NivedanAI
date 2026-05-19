import { pgTable, text, uuid, timestamp, integer } from 'drizzle-orm/pg-core'
import { users } from './users'

export const rfpJobs = pgTable('rfp_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  inngestRunId: text('inngest_run_id'),
  status: text('status').default('pending').notNull(), // pending | running | awaiting_review | completed | failed
  clientName: text('client_name'),
  clientIndustry: text('client_industry'),
  rfpTitle: text('rfp_title'),
  budgetCeiling: text('budget_ceiling'),
  deadline: text('deadline'),
  currentAgent: integer('current_agent'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const rfpDocuments = pgTable('rfp_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfpJobId: uuid('rfp_job_id').notNull().unique().references(() => rfpJobs.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  pageCount: integer('page_count'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
})

export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfpJobId: uuid('rfp_job_id').notNull().references(() => rfpJobs.id, { onDelete: 'cascade' }),
  agentNumber: integer('agent_number').notNull(), // 1–6
  agentName: text('agent_name').notNull(), // orchestrator | rfp_parser | client_research | requirements_matcher | proposal_writer | quality_review
  modelUsed: text('model_used').notNull(),
  status: text('status').default('pending').notNull(), // pending | running | completed | failed | skipped
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  durationMs: integer('duration_ms'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
})

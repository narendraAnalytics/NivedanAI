import { pgTable, text, uuid, timestamp, boolean, jsonb, numeric } from 'drizzle-orm/pg-core'
import { rfpJobs } from './jobs'
import { knowledgeBaseItems } from './company'

export const parsedRfpData = pgTable('parsed_rfp_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfpJobId: uuid('rfp_job_id').notNull().unique().references(() => rfpJobs.id, { onDelete: 'cascade' }),
  mandatoryRequirements: jsonb('mandatory_requirements').notNull(),
  optionalRequirements: jsonb('optional_requirements'),
  budgetCeiling: text('budget_ceiling'),
  submissionDeadline: text('submission_deadline'),
  projectTimeline: text('project_timeline'),
  evaluationCriteria: jsonb('evaluation_criteria'),
  vendorQualifications: jsonb('vendor_qualifications'),
  complianceRequirements: jsonb('compliance_requirements'),
  contactInfo: jsonb('contact_info'),
  rawSummary: text('raw_summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const clientResearchData = pgTable('client_research_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfpJobId: uuid('rfp_job_id').notNull().unique().references(() => rfpJobs.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  industry: text('industry'),
  companySummary: text('company_summary'),
  recentNews: jsonb('recent_news'),
  strategicPriorities: jsonb('strategic_priorities'),
  keyChallenges: jsonb('key_challenges'),
  leadership: jsonb('leadership'),
  fundingStage: text('funding_stage'),
  competitors: jsonb('competitors'),
  sources: jsonb('sources'),
  researchConfidence: text('research_confidence'), // high | medium | low
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const capabilityMatches = pgTable('capability_matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfpJobId: uuid('rfp_job_id').notNull().references(() => rfpJobs.id, { onDelete: 'cascade' }),
  requirementId: text('requirement_id').notNull(),
  requirementText: text('requirement_text').notNull(),
  knowledgeBaseItemId: uuid('knowledge_base_item_id').references(() => knowledgeBaseItems.id, { onDelete: 'set null' }),
  matchSummary: text('match_summary'),
  confidenceScore: numeric('confidence_score', { precision: 3, scale: 2 }),
  isGap: boolean('is_gap').default(false).notNull(),
  gapSuggestion: text('gap_suggestion'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

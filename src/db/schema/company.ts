import { pgTable, text, uuid, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const companyProfiles = pgTable('company_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  industry: text('industry'),
  website: text('website'),
  logoUrl: text('logo_url'),
  brandColorPrimary: text('brand_color_primary').default('#1a1a2e'),
  brandColorSecondary: text('brand_color_secondary').default('#16213e'),
  tagline: text('tagline'),
  foundedYear: integer('founded_year'),
  teamSize: text('team_size'),
  isOnboarded: boolean('is_onboarded').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const knowledgeBaseItems = pgTable('knowledge_base_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyProfileId: uuid('company_profile_id').notNull().references(() => companyProfiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // case_study | certification | team_bio | past_proposal | technology | testimonial
  title: text('title').notNull(),
  description: text('description').notNull(),
  tags: text('tags').array(),
  industry: text('industry'),
  fileUrl: text('file_url'),
  metrics: jsonb('metrics'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

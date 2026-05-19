CREATE TABLE "capability_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_job_id" uuid NOT NULL,
	"requirement_id" text NOT NULL,
	"requirement_text" text NOT NULL,
	"knowledge_base_item_id" uuid,
	"match_summary" text,
	"confidence_score" numeric(3, 2),
	"is_gap" boolean DEFAULT false NOT NULL,
	"gap_suggestion" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_research_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_job_id" uuid NOT NULL,
	"company_name" text NOT NULL,
	"industry" text,
	"company_summary" text,
	"recent_news" jsonb,
	"strategic_priorities" jsonb,
	"key_challenges" jsonb,
	"leadership" jsonb,
	"funding_stage" text,
	"competitors" jsonb,
	"sources" jsonb,
	"research_confidence" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_research_data_rfp_job_id_unique" UNIQUE("rfp_job_id")
);
--> statement-breakpoint
CREATE TABLE "parsed_rfp_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_job_id" uuid NOT NULL,
	"mandatory_requirements" jsonb NOT NULL,
	"optional_requirements" jsonb,
	"budget_ceiling" text,
	"submission_deadline" text,
	"project_timeline" text,
	"evaluation_criteria" jsonb,
	"vendor_qualifications" jsonb,
	"compliance_requirements" jsonb,
	"contact_info" jsonb,
	"raw_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parsed_rfp_data_rfp_job_id_unique" UNIQUE("rfp_job_id")
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"industry" text,
	"website" text,
	"logo_url" text,
	"brand_color_primary" text DEFAULT '#1a1a2e',
	"brand_color_secondary" text DEFAULT '#16213e',
	"tagline" text,
	"founded_year" integer,
	"team_size" text,
	"is_onboarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_profile_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"tags" text[],
	"industry" text,
	"file_url" text,
	"metrics" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_job_id" uuid NOT NULL,
	"agent_number" integer NOT NULL,
	"agent_name" text NOT NULL,
	"model_used" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"duration_ms" integer,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rfp_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_job_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size_bytes" integer,
	"page_count" integer,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rfp_documents_rfp_job_id_unique" UNIQUE("rfp_job_id")
);
--> statement-breakpoint
CREATE TABLE "rfp_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"inngest_run_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"client_name" text,
	"client_industry" text,
	"rfp_title" text,
	"budget_ceiling" text,
	"deadline" text,
	"current_agent" integer,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hitl_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"flagged_sections" text[],
	"feedback_text" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"pdf_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size_bytes" integer,
	"email_sent_to" text,
	"email_sent_at" timestamp,
	"resend_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_job_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"executive_summary" text,
	"understanding_of_requirements" text,
	"proposed_solution" text,
	"technical_approach" text,
	"case_studies" text,
	"team_and_expertise" text,
	"project_timeline" text,
	"pricing_structure" text,
	"quality_review_notes" text,
	"quality_score" numeric(3, 2),
	"is_approved" boolean DEFAULT false NOT NULL,
	"word_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_rfp_job_id_unique" UNIQUE("rfp_job_id")
);
--> statement-breakpoint
ALTER TABLE "capability_matches" ADD CONSTRAINT "capability_matches_rfp_job_id_rfp_jobs_id_fk" FOREIGN KEY ("rfp_job_id") REFERENCES "public"."rfp_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_matches" ADD CONSTRAINT "capability_matches_knowledge_base_item_id_knowledge_base_items_id_fk" FOREIGN KEY ("knowledge_base_item_id") REFERENCES "public"."knowledge_base_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_research_data" ADD CONSTRAINT "client_research_data_rfp_job_id_rfp_jobs_id_fk" FOREIGN KEY ("rfp_job_id") REFERENCES "public"."rfp_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parsed_rfp_data" ADD CONSTRAINT "parsed_rfp_data_rfp_job_id_rfp_jobs_id_fk" FOREIGN KEY ("rfp_job_id") REFERENCES "public"."rfp_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_items" ADD CONSTRAINT "knowledge_base_items_company_profile_id_company_profiles_id_fk" FOREIGN KEY ("company_profile_id") REFERENCES "public"."company_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_rfp_job_id_rfp_jobs_id_fk" FOREIGN KEY ("rfp_job_id") REFERENCES "public"."rfp_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfp_documents" ADD CONSTRAINT "rfp_documents_rfp_job_id_rfp_jobs_id_fk" FOREIGN KEY ("rfp_job_id") REFERENCES "public"."rfp_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfp_jobs" ADD CONSTRAINT "rfp_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hitl_reviews" ADD CONSTRAINT "hitl_reviews_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_exports" ADD CONSTRAINT "proposal_exports_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_rfp_job_id_rfp_jobs_id_fk" FOREIGN KEY ("rfp_job_id") REFERENCES "public"."rfp_jobs"("id") ON DELETE cascade ON UPDATE no action;
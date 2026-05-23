ALTER TABLE "rfp_jobs" ADD COLUMN "recipient_email" text;--> statement-breakpoint
ALTER TABLE "rfp_jobs" ADD COLUMN "current_activity" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "cover_letter" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "risks_mitigation" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "assumptions_dependencies" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "why_us" text;
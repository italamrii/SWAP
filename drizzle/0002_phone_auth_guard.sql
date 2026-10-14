CREATE TYPE "public"."appeal_status" AS ENUM('open', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."guard_flag_status" AS ENUM('open', 'cleared', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."guard_severity" AS ENUM('info', 'warn', 'high');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('login', 'change', 'claim');--> statement-breakpoint
CREATE TYPE "public"."possession_proof_status" AS ENUM('requested', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"flag_id" uuid,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" "appeal_status" DEFAULT 'open' NOT NULL,
	"reviewer_id" uuid,
	"review_note" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guard_acknowledgements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"codes" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guard_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"user_id" uuid,
	"severity" "guard_severity" NOT NULL,
	"signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "guard_flag_status" DEFAULT 'open' NOT NULL,
	"holding" boolean DEFAULT false NOT NULL,
	"reviewer_id" uuid,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_fingerprints" (
	"url" text PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"dhash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phone_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"user_id" uuid,
	"code_hash" text NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"max_attempts" smallint DEFAULT 5 NOT NULL,
	"ip_hash" text,
	"delivered" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "possession_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"image_url" text,
	"status" "possession_proof_status" DEFAULT 'requested' NOT NULL,
	"reason" text NOT NULL,
	"submitted_at" timestamp with time zone,
	"reviewer_id" uuid,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "guard_codes" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_released_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_flag_id_guard_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."guard_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guard_acknowledgements" ADD CONSTRAINT "guard_acknowledgements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guard_flags" ADD CONSTRAINT "guard_flags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guard_flags" ADD CONSTRAINT "guard_flags_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_fingerprints" ADD CONSTRAINT "media_fingerprints_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_otps" ADD CONSTRAINT "phone_otps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "possession_proofs" ADD CONSTRAINT "possession_proofs_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "possession_proofs" ADD CONSTRAINT "possession_proofs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "possession_proofs" ADD CONSTRAINT "possession_proofs_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appeals_status_idx" ON "appeals" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "appeals_user_idx" ON "appeals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "guard_ack_subject_idx" ON "guard_acknowledgements" USING btree ("user_id","subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "guard_flags_status_idx" ON "guard_flags" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "guard_flags_subject_idx" ON "guard_flags" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "media_fingerprints_dhash_idx" ON "media_fingerprints" USING btree ("dhash");--> statement-breakpoint
CREATE INDEX "media_fingerprints_owner_idx" ON "media_fingerprints" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "phone_otps_phone_idx" ON "phone_otps" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "phone_otps_ip_idx" ON "phone_otps" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "phone_otps_created_idx" ON "phone_otps" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "possession_proofs_listing_idx" ON "possession_proofs" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "possession_proofs_status_idx" ON "possession_proofs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("sender_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_uq" ON "users" USING btree ("phone") WHERE "users"."phone" is not null;
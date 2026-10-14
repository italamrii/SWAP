CREATE TABLE "request_rate_limits" (
  "key" text NOT NULL,
  "window_start" bigint NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "request_rate_limits_key_window_pk" PRIMARY KEY("key","window_start")
);--> statement-breakpoint
CREATE INDEX "request_rate_limits_window_idx" ON "request_rate_limits" USING btree ("window_start");
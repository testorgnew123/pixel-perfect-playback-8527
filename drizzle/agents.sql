-- Agents feature: the three new tables (agents, agent_commissions, agent_settings).
-- Purely additive and idempotent. Same shape (and constraint names) that `drizzle-kit push` generates for
-- drizzle/schema.ts, but it touches nothing else. Run once against the database (Neon SQL editor or psql)
-- BEFORE the agents code runs, because recordPayment, adminCancelBooking and getBookingDetail now query
-- agent_commissions. No need to re-run drizzle/functions.sql afterwards (no functions or sequences involved).
BEGIN;

CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"user_id" text,
	"status" text DEFAULT 'invited' NOT NULL,
	"commission_percent" numeric,
	"invited_by" text,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_email_unique" UNIQUE("email"),
	CONSTRAINT "agents_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "agents_commission_percent_range" CHECK ("agents"."commission_percent" is null or ("agents"."commission_percent" >= 0 and "agents"."commission_percent" <= 100)),
	CONSTRAINT "agents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "agent_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"rate_percent" numeric NOT NULL,
	"basis_amount" numeric NOT NULL,
	"amount" numeric NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"earned_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"paid_by" text,
	"payout_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_commissions_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "agent_commissions_amount_nonneg" CHECK ("agent_commissions"."amount" >= 0),
	CONSTRAINT "agent_commissions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "agent_commissions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE restrict ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "agent_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"default_commission_percent" numeric DEFAULT '5' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_settings_singleton" CHECK ("agent_settings"."id" = 1),
	CONSTRAINT "agent_settings_percent_range" CHECK ("agent_settings"."default_commission_percent" >= 0 and "agent_settings"."default_commission_percent" <= 100)
);

COMMIT;

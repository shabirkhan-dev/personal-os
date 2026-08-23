CREATE TABLE "finance_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"month" varchar(7) NOT NULL,
	"category" varchar(64) NOT NULL,
	"limit_minor" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(10) NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"category" varchar(64),
	"note" varchar(280),
	"occurred_on" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_budgets" ADD CONSTRAINT "finance_budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "finance_budgets_user_month_category_unique" ON "finance_budgets" USING btree ("user_id","month","category");--> statement-breakpoint
CREATE INDEX "finance_budgets_user_month_idx" ON "finance_budgets" USING btree ("user_id","month");--> statement-breakpoint
CREATE INDEX "finance_transactions_user_date_idx" ON "finance_transactions" USING btree ("user_id","occurred_on");--> statement-breakpoint
CREATE INDEX "finance_transactions_user_type_idx" ON "finance_transactions" USING btree ("user_id","type");
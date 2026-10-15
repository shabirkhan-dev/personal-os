CREATE SEQUENCE "public"."sync_records_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "sync_records" (
	"user_id" uuid NOT NULL,
	"collection" varchar(64) NOT NULL,
	"id" varchar(64) NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	"seq" bigint DEFAULT nextval('sync_records_seq') NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_records_user_id_collection_id_pk" PRIMARY KEY("user_id","collection","id")
);
--> statement-breakpoint
ALTER TABLE "sync_records" ADD CONSTRAINT "sync_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_records_user_seq_idx" ON "sync_records" USING btree ("user_id","seq");
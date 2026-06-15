CREATE SCHEMA IF NOT EXISTS "si_registres";
--> statement-breakpoint
CREATE TABLE "si_registres"."traitement_data" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nom_traitement" text NOT NULL,
	"reference" text NOT NULL,
	"description_finalite" text,
	"date_creation_fiche" timestamp,
	"date_mise_a_jour_fiche" timestamp,
	"drive_folder_url" text,
	"fiche_pdf_url" text,
	"preuve_consentement_url" text,
	"preuve_mentions_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "traitement_data_user_id_idx" ON "si_registres"."traitement_data" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "si_registres"."registre_rgpd" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"annee_civile" integer NOT NULL,
	"nom" text NOT NULL,
	"drive_folder_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "registre_rgpd_user_id_idx" ON "si_registres"."registre_rgpd" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "registre_rgpd_annee_civile_idx" ON "si_registres"."registre_rgpd" USING btree ("annee_civile");
--> statement-breakpoint
CREATE TABLE "si_registres"."registre_licences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"annee_civile" integer NOT NULL,
	"nom" text NOT NULL,
	"drive_folder_url" text,
	"date_facturation" timestamp,
	"utilisation_commerciale" boolean DEFAULT false,
	"licence_commerciale_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "registre_licences_user_id_idx" ON "si_registres"."registre_licences" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "registre_licences_annee_civile_idx" ON "si_registres"."registre_licences" USING btree ("annee_civile");
--> statement-breakpoint
CREATE TABLE "si_registres"."registre_bdd" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"annee_civile" integer NOT NULL,
	"nom" text NOT NULL,
	"drive_folder_url" text,
	"traitement_data_id" text,
	"sheet_excel_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "registre_bdd_user_id_idx" ON "si_registres"."registre_bdd" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "registre_bdd_traitement_data_id_idx" ON "si_registres"."registre_bdd" USING btree ("traitement_data_id");
--> statement-breakpoint
ALTER TABLE "si_registres"."traitement_data" ADD CONSTRAINT "traitement_data_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "si_registres"."registre_rgpd" ADD CONSTRAINT "registre_rgpd_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "si_registres"."registre_licences" ADD CONSTRAINT "registre_licences_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "si_registres"."registre_bdd" ADD CONSTRAINT "registre_bdd_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "si_registres"."registre_bdd" ADD CONSTRAINT "registre_bdd_traitement_data_id_traitement_data_id_fk" FOREIGN KEY ("traitement_data_id") REFERENCES "si_registres"."traitement_data"("id") ON DELETE set null ON UPDATE no action;

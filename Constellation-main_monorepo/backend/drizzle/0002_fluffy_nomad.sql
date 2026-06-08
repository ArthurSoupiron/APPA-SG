CREATE TABLE "gw"."workspace_group_permission" (
	"workspace_group_id" text NOT NULL,
	"permission" text NOT NULL,
	CONSTRAINT "workspace_group_permission_workspace_group_id_permission_pk" PRIMARY KEY("workspace_group_id","permission")
);
--> statement-breakpoint
ALTER TABLE "gw"."workspace_group_permission" ADD CONSTRAINT "workspace_group_permission_workspace_group_id_workspace_group_id_fk" FOREIGN KEY ("workspace_group_id") REFERENCES "gw"."workspace_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wgp_permission_idx" ON "gw"."workspace_group_permission" USING btree ("permission");
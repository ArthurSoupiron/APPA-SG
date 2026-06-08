-- Suppression du système de labels SI (doublon avec category) : assignments puis catalogue.
DROP TABLE IF EXISTS "si"."ticket_label_assignment";
--> statement-breakpoint
DROP TABLE IF EXISTS "si"."ticket_label";

import { boolean, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { opsSchema } from "../schemas";

/** Singleton (`id = 'default'`) — politique d'authentification email/mot de passe. */
export const systemAuthPolicy = opsSchema.table("system_auth_policy", {
  id: text("id").primaryKey(),
  emailPasswordEnabled: boolean("email_password_enabled")
    .default(true)
    .notNull(),
  updatedBy: text("updated_by").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

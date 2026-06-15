import { boolean, text, timestamp } from "drizzle-orm/pg-core";

import { authSchema } from "../schemas";

/** Utilisateur — aligné sur Better Auth (`auth.user`). */
export const user = authSchema.table("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  /** Legacy / Better Auth — non utilisé pour l’UBAC */
  role: text("role").default("user"),
});

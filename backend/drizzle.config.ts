import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./src/db/database-url";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});

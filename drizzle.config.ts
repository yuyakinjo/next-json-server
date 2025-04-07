import type { Config } from "drizzle-kit";

export default {
  schema: "./app/api/db/postgres/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
} satisfies Config;

import type { Config } from "drizzle-kit";

export default {
  schema: "./app/api/db/postgres/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // alterモード設定
  strict: true,
  verbose: true,
} satisfies Config;

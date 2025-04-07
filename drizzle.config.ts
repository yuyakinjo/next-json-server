import type { Config } from "drizzle-kit";

export default {
  schema: "./app/db/pg/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // alterモード設定
  strict: true,
  verbose: true,
} satisfies Config;

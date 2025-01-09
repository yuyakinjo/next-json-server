import { join } from "node:path";

const rootDir = process.cwd();
export const DB_JSON_PATH = join(rootDir, "db.json");

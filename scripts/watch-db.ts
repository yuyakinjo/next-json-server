import { spawn } from "node:child_process";
import { watch } from "node:fs";
import path from "node:path";

const pgApiDir = path.join(process.cwd(), "app", "api", "db", "postgres");
const schemaDir = path.join(pgApiDir, "schema");
const dbJsonPath = path.join(process.cwd(), "db.json");

console.log("データベース関連ファイルの監視を開始します...");
console.log(`監視対象: ${schemaDir}, ${dbJsonPath}`);

// PostgreSQLスキーマディレクトリの監視
watch(schemaDir, { recursive: true }, async (_, filename) => {
  if (!filename) return;

  console.log(`変更を検知: ${path.join(schemaDir, filename.toString())}`);
  runMigration();
});

// db.jsonファイルの監視
watch(dbJsonPath, async () => {
  console.log(`変更を検知: ${dbJsonPath}`);
  runMigration();
});

// APIディレクトリの監視
watch(
  path.join(pgApiDir, "[...api]"),
  { recursive: true },
  async (_, filename) => {
    if (!filename) return;

    console.log(
      `変更を検知: ${path.join(pgApiDir, "[...api]", filename.toString())}`,
    );
    runMigration();
  },
);

// マイグレーションを実行する関数
function runMigration() {
  console.log("マイグレーションを実行します...");

  // マイグレーションスキーマ生成
  const generateProcess = spawn(
    "bunx",
    ["drizzle-kit", "generate:pg", "--schema=app/db/pg/schema/index.ts"],
    { stdio: "inherit" },
  );

  generateProcess.on("close", (code) => {
    if (code !== 0) {
      console.error("マイグレーションスキーマの生成に失敗しました");
      return;
    }

    console.log("マイグレーションスキーマの生成が完了しました");

    // マイグレーション実行
    const migrateProcess = spawn("bun", ["app/db/pg/migrate.ts"], {
      stdio: "inherit",
    });

    migrateProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("マイグレーションの実行に失敗しました");
        return;
      }

      console.log("マイグレーションが正常に完了しました");
    });
  });
}

// 初回起動時にもマイグレーションを実行
runMigration();

console.log("監視を継続しています...");

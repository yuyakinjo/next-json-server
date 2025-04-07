import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// 環境変数からデータベース接続情報を取得
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("環境変数DATABASE_URLが設定されていません");
  process.exit(1);
}

// 指定時間待機する関数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// マイグレーションの実行（リトライ機能付き）
async function runMigration(retries = 5, delay = 2000) {
  // TypeScriptのエラーを回避するため、ここで再チェック
  if (!connectionString) {
    return;
  }

  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const migrationClient = postgres(connectionString, { max: 1 });
      const db = drizzle(migrationClient);

      // マイグレーションの実行
      await migrate(db, { migrationsFolder: "drizzle" });

      console.log("マイグレーションが完了しました");
      await migrationClient.end();
      return; // 成功したら関数を終了
    } catch (error) {
      lastError = error;
      console.error(`マイグレーション試行 ${i + 1}/${retries} 失敗:`, error);

      if (i < retries - 1) {
        console.log(`${delay / 1000}秒後に再試行します...`);
        await sleep(delay);
      }
    }
  }

  // すべてのリトライが失敗した場合
  console.error(`マイグレーションが${retries}回試行後も失敗しました`);
  console.error("最後のエラー:", lastError);
  process.exit(1);
}

// マイグレーションの実行
async function main() {
  console.log("マイグレーションを開始します...");
  await runMigration();
}

main();

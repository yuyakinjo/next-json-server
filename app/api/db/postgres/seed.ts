import { readFileSync } from "node:fs";
import path from "node:path";
import type { PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// 環境変数からデータベース接続情報を取得
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("環境変数DATABASE_URLが設定されていません");
  process.exit(1);
}

// 指定時間待機する関数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// スキーマからテーブルを取得する関数
function getTable(tableName: string): PgTable | undefined {
  return Object.entries(schema).find(
    ([key, value]) =>
      key === tableName && typeof value === "object" && "name" in value,
  )?.[1] as PgTable | undefined;
}

// db.jsonからデータを読み込む
function loadData(): Record<string, unknown[]> {
  const workDir = process.cwd();
  const dbJsonPath = path.join(workDir, "db.json");

  try {
    const dbJsonContent = readFileSync(dbJsonPath, "utf-8");
    return JSON.parse(dbJsonContent);
  } catch (error) {
    console.error("db.jsonの読み込みに失敗しました:", error);
    process.exit(1);
  }
}

// シードデータの挿入（リトライ機能付き）
async function runSeed(retries = 5, delay = 2000) {
  if (!connectionString) {
    return;
  }

  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const client = postgres(connectionString);
      const db = drizzle(client, { schema });

      // db.jsonからデータを読み込む
      const data = loadData();

      console.log("データベースのシードを開始します...");

      // データの挿入前に既存データをクリア（オプション）
      // 注: 本番環境では注意が必要です
      console.log("既存のデータをクリアしています...");
      for (const tableName of Object.keys(data)) {
        const table = getTable(tableName);
        if (table) {
          await db.delete(table);
        }
      }

      try {
        // 最初にリレーションがないテーブルのデータを挿入
        for (const [tableName, tableData] of Object.entries(data)) {
          const table = getTable(tableName);
          if (table && Array.isArray(tableData)) {
            // 配列フィールドを持つデータを処理（リレーション対応）
            const processedData = (tableData as Record<string, unknown>[]).map(
              (item: Record<string, unknown>) => {
                const processedItem: Record<string, unknown> = {};

                for (const [key, value] of Object.entries(item)) {
                  // 配列フィールドはスキップする（後で別途処理）
                  if (!Array.isArray(value)) {
                    processedItem[key] = value;
                  }
                }

                return processedItem;
              },
            );

            console.log(`テーブル ${tableName} にデータを挿入中...`);
            for (const item of processedData) {
              try {
                await db.insert(table).values(item as Record<string, unknown>);
              } catch (error) {
                console.error(`${tableName}テーブルへの挿入エラー:`, error);
                // エラーがあっても継続
              }
            }
          }
        }

        // リレーションを含むデータを2回目のパスで処理
        // 親テーブルのデータが挿入された後で行う必要がある
        for (const [tableName, tableData] of Object.entries(data)) {
          if (Array.isArray(tableData)) {
            // ネストされた配列フィールドを処理
            for (const item of tableData as Record<string, unknown>[]) {
              for (const [key, value] of Object.entries(item)) {
                if (Array.isArray(value)) {
                  // 配列フィールド名から関連テーブル名を推測
                  // (例: posts_comments など)
                  const relatedTableName = `${tableName}_${key}`;

                  const relatedTable = getTable(relatedTableName);
                  if (relatedTable) {
                    console.log(
                      `関連テーブル ${relatedTableName} にデータを挿入中...`,
                    );

                    for (const relatedItem of value as Record<
                      string,
                      unknown
                    >[]) {
                      try {
                        // 親テーブルへの参照を追加
                        const parentIdField = `${tableName}Id`;
                        await db.insert(relatedTable).values({
                          ...relatedItem,
                          [parentIdField]: item.id,
                        } as Record<string, unknown>);
                      } catch (error) {
                        console.error(
                          `${relatedTableName}テーブルへの挿入エラー:`,
                          error,
                        );
                        // エラーがあっても継続
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("データ挿入中にエラーが発生しました:", error);
      }

      console.log("データベースのシードが完了しました");
      await client.end();
      return; // 成功したら関数を終了
    } catch (error) {
      lastError = error;
      console.error(`シード試行 ${i + 1}/${retries} 失敗:`, error);

      if (i < retries - 1) {
        console.log(`${delay / 1000}秒後に再試行します...`);
        await sleep(delay);
      }
    }
  }

  // すべてのリトライが失敗した場合
  console.error(`シードが${retries}回試行後も失敗しました`);
  console.error("最後のエラー:", lastError);
  process.exit(1);
}

// シードの実行
async function main() {
  console.log("データベースのシードを開始します...");
  await runSeed();
}

main();

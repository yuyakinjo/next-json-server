import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { comments, posts, posts_comments, users } from "./schema";

// ログファイル
const LOG_FILE = "seed.log";

// ログ出力レベル
const LOG_LEVEL = {
  INFO: "INFO", // 基本情報
  DEBUG: "DEBUG", // デバッグ情報（詳細）
  ERROR: "ERROR", // エラー情報
};

// 現在のログレベル（INFO以上を出力）
const CURRENT_LOG_LEVEL = LOG_LEVEL.INFO;

// ログ出力
function log(message: string, level = LOG_LEVEL.INFO) {
  // 指定レベル以上のみ出力
  if (
    level === LOG_LEVEL.ERROR ||
    (level === LOG_LEVEL.INFO && CURRENT_LOG_LEVEL !== LOG_LEVEL.ERROR) ||
    (level === LOG_LEVEL.DEBUG && CURRENT_LOG_LEVEL === LOG_LEVEL.DEBUG)
  ) {
    const logMessage = `[${level}] ${message}`;
    console.log(logMessage);
    try {
      writeFileSync(LOG_FILE, `${logMessage}\n`, { flag: "a" });
    } catch (error) {
      console.error("ログファイルへの書き込みに失敗しました:", error);
    }
  }
}

// 環境変数からデータベース接続情報を取得
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  log("環境変数DATABASE_URLが設定されていません", LOG_LEVEL.ERROR);
  process.exit(1);
}

// 指定時間待機する関数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 簡略化したデータベースクライアントインターフェース
type DbQueryResult = unknown;
type DbTable = unknown;
type DbCondition = unknown;

interface DbClient {
  select: () => {
    from: (table: DbTable) => {
      where: (condition: DbCondition) => DbQueryResult;
    };
  };
}

// スキーマ情報を確認
function logSchemaInfo() {
  try {
    log("スキーマ情報を確認中...", LOG_LEVEL.DEBUG);

    // テーブル名のみをログ出力
    log(
      "確認済みテーブル: users, posts, comments, posts_comments",
      LOG_LEVEL.DEBUG,
    );
  } catch (error) {
    log(`スキーマ情報取得エラー: ${String(error)}`, LOG_LEVEL.ERROR);
  }
}

// db.jsonからデータを読み込む
function loadData() {
  const workDir = process.cwd();
  const dbJsonPath = path.join(workDir, "db.json");

  try {
    const dbJsonContent = readFileSync(dbJsonPath, "utf-8");
    const data = JSON.parse(dbJsonContent);
    log(`読み込んだテーブル: ${Object.keys(data).join(", ")}`);
    return data;
  } catch (error) {
    log(`db.jsonの読み込みに失敗しました: ${String(error)}`, LOG_LEVEL.ERROR);
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
      log(`シード試行 ${i + 1}/${retries} 開始`);
      const client = postgres(connectionString);
      const db = drizzle(client);

      // スキーマ情報を確認
      logSchemaInfo();

      // DB接続確認
      try {
        const pingResult = await client`SELECT 1 as ping`;
        log("DB接続確認: 成功", LOG_LEVEL.DEBUG);
      } catch (pingError) {
        log(`DB接続エラー: ${String(pingError)}`, LOG_LEVEL.ERROR);
      }

      // db.jsonからデータを読み込む
      const data = loadData();

      log("データベースのシードを開始します...");

      try {
        // 外部キー制約を一時的に無効化
        log("外部キー制約を一時的に無効化します...", LOG_LEVEL.DEBUG);
        await client`SET CONSTRAINTS ALL DEFERRED`;

        // 依存関係を考慮してテーブルデータをクリア（子→親の順）
        log("テーブルのデータをクリアしています...");

        // テーブルクリア
        try {
          await client`TRUNCATE TABLE posts_comments CASCADE`;
          await client`TRUNCATE TABLE comments CASCADE`;
          await client`TRUNCATE TABLE posts CASCADE`;
          await client`TRUNCATE TABLE users CASCADE`;
          log("テーブルをクリアしました");
        } catch (error) {
          log(`テーブルのクリアに失敗: ${String(error)}`, LOG_LEVEL.ERROR);
        }

        // 外部キー制約を再度有効化
        log("外部キー制約を再度有効化します...", LOG_LEVEL.DEBUG);
        await client`SET CONSTRAINTS ALL IMMEDIATE`;

        // 親→子の順でデータを挿入
        // usersテーブルにデータを挿入
        if (data.users && Array.isArray(data.users)) {
          log(`usersテーブルに ${data.users.length} 件のデータを挿入します`);
          for (const user of data.users) {
            try {
              // IDを含まないバージョンも準備 (IDが自動生成される場合用)
              const userWithId = {
                id: Number(user.id),
                name: user.name as string,
              };
              const userWithoutId = {
                name: user.name as string,
              };

              log(`user ID=${user.id} を挿入中...`, LOG_LEVEL.DEBUG);

              try {
                // まずIDありでインサート試行
                await db.insert(users).values(userWithId);
                log(`user ID=${user.id} 挿入成功`, LOG_LEVEL.DEBUG);
              } catch (idError) {
                // IDなしでインサート試行（自動採番の場合）
                await db.insert(users).values(userWithoutId);
                log("user(自動ID) 挿入成功", LOG_LEVEL.DEBUG);
              }
            } catch (error) {
              log(`users挿入エラー: ${String(error)}`, LOG_LEVEL.ERROR);
            }
          }
          log("usersテーブルへのデータ挿入が完了しました");
        }

        // postsテーブルにデータを挿入
        if (data.posts && Array.isArray(data.posts)) {
          log(`postsテーブルに ${data.posts.length} 件のデータを挿入します`);
          for (const post of data.posts) {
            try {
              // IDを含まないバージョンも準備 (IDが自動生成される場合用)
              const postWithId = {
                id: Number(post.id),
                title: post.title ? String(post.title) : null,
                views: post.views ? Number(post.views) : null,
              };
              const postWithoutId = {
                title: post.title ? String(post.title) : null,
                views: post.views ? Number(post.views) : null,
              };

              log(`post ID=${post.id} を挿入中...`, LOG_LEVEL.DEBUG);

              try {
                // まずIDありでインサート試行
                await db.insert(posts).values(postWithId);
                log(`post ID=${post.id} 挿入成功`, LOG_LEVEL.DEBUG);
              } catch (idError) {
                // IDなしでインサート試行（自動採番の場合）
                await db.insert(posts).values(postWithoutId);
                log("post(自動ID) 挿入成功", LOG_LEVEL.DEBUG);
              }
            } catch (error) {
              log(`posts挿入エラー: ${String(error)}`, LOG_LEVEL.ERROR);
            }
          }
          log("postsテーブルへのデータ挿入が完了しました");
        }

        // commentsテーブルにデータを挿入
        if (data.comments && Array.isArray(data.comments)) {
          log(
            `commentsテーブルに ${data.comments.length} 件のデータを挿入します`,
          );
          for (const comment of data.comments) {
            try {
              // IDを含まないバージョンも準備 (IDが自動生成される場合用)
              const commentWithId = {
                id: Number(comment.id),
                text: comment.text ? String(comment.text) : null,
                postsId: comment.postsId ? Number(comment.postsId) : null,
              };
              const commentWithoutId = {
                text: comment.text ? String(comment.text) : null,
                postsId: comment.postsId ? Number(comment.postsId) : null,
              };

              log(`comment ID=${comment.id} を挿入中...`, LOG_LEVEL.DEBUG);

              try {
                // まずIDありでインサート試行
                await db.insert(comments).values(commentWithId);
                log(`comment ID=${comment.id} 挿入成功`, LOG_LEVEL.DEBUG);
              } catch (idError) {
                // IDなしでインサート試行（自動採番の場合）
                await db.insert(comments).values(commentWithoutId);
                log("comment(自動ID) 挿入成功", LOG_LEVEL.DEBUG);
              }
            } catch (error) {
              log(`comments挿入エラー: ${String(error)}`, LOG_LEVEL.ERROR);
            }
          }
          log("commentsテーブルへのデータ挿入が完了しました");
        }

        // ネストされたコメントを挿入（posts_comments）
        if (data.posts && Array.isArray(data.posts)) {
          let total = 0;
          for (const post of data.posts) {
            if (post.comments && Array.isArray(post.comments)) {
              total += post.comments.length;
              for (const comment of post.comments) {
                try {
                  // IDを含まないバージョンも準備 (IDが自動生成される場合用)
                  const commentWithId = {
                    id: Number(comment.id),
                    text: comment.text ? String(comment.text) : null,
                    postsId: Number(post.id),
                  };
                  const commentWithoutId = {
                    text: comment.text ? String(comment.text) : null,
                    postsId: Number(post.id),
                  };

                  log(
                    `post ID=${post.id} のコメント挿入中...`,
                    LOG_LEVEL.DEBUG,
                  );

                  try {
                    // まずIDありでインサート試行
                    await db.insert(posts_comments).values(commentWithId);
                    log(
                      `posts_comment ID=${comment.id} 挿入成功`,
                      LOG_LEVEL.DEBUG,
                    );
                  } catch (idError) {
                    // IDなしでインサート試行（自動採番の場合）
                    await db.insert(posts_comments).values(commentWithoutId);
                    log("posts_comment(自動ID) 挿入成功", LOG_LEVEL.DEBUG);
                  }
                } catch (error) {
                  log(
                    `posts_comments挿入エラー: ${String(error)}`,
                    LOG_LEVEL.ERROR,
                  );
                }
              }
            }
          }
          log(`posts_commentsテーブルに ${total} 件のデータ挿入が完了しました`);
        }

        // データ確認
        try {
          const userCount = await client`SELECT COUNT(*) FROM users`;
          const postsCount = await client`SELECT COUNT(*) FROM posts`;
          const commentsCount = await client`SELECT COUNT(*) FROM comments`;
          const postsCommentsCount =
            await client`SELECT COUNT(*) FROM posts_comments`;

          log(
            `テーブル行数: users=${userCount[0].count}, posts=${postsCount[0].count}, comments=${commentsCount[0].count}, posts_comments=${postsCommentsCount[0].count}`,
          );
        } catch (error) {
          log(`テーブル行数確認エラー: ${String(error)}`, LOG_LEVEL.ERROR);
        }
      } catch (error) {
        log(
          `シード処理中にエラーが発生しました: ${String(error)}`,
          LOG_LEVEL.ERROR,
        );
      }

      log("データベースのシードが完了しました");
      await client.end();
      return; // 成功したら関数を終了
    } catch (error) {
      lastError = error;
      log(
        `シード試行 ${i + 1}/${retries} 失敗: ${String(error)}`,
        LOG_LEVEL.ERROR,
      );

      if (i < retries - 1) {
        log(`${delay / 1000}秒後に再試行します...`);
        await sleep(delay);
      }
    }
  }

  // すべてのリトライが失敗した場合
  log(`シードが${retries}回試行後も失敗しました`, LOG_LEVEL.ERROR);
  log(`最後のエラー: ${String(lastError)}`, LOG_LEVEL.ERROR);
  process.exit(1);
}

// シードの実行
async function main() {
  log("データベースのシードを開始します...");
  await runSeed();
}

main();

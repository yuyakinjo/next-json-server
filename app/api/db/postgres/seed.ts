import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { comments, posts, posts_comments, users } from "./schema";

// ログファイル
const LOG_FILE = "/app/seed.log";

// ログ出力
function log(message: string) {
  console.log(message);
  try {
    writeFileSync(LOG_FILE, `${message}\n`, { flag: "a" });
  } catch (error) {
    console.error("ログファイルへの書き込みに失敗しました:", error);
  }
}

// 環境変数からデータベース接続情報を取得
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  log("環境変数DATABASE_URLが設定されていません");
  process.exit(1);
}

// 指定時間待機する関数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// スキーマ情報を確認
function logSchemaInfo() {
  try {
    log("=== スキーマ情報 ===");

    // usersテーブル
    log("usersテーブル構造:");
    for (const [key, value] of Object.entries(users)) {
      if (key !== "name") {
        log(`- ${key}: ${JSON.stringify(value)}`);
      }
    }

    // postsテーブル
    log("postsテーブル構造:");
    for (const [key, value] of Object.entries(posts)) {
      if (key !== "name") {
        log(`- ${key}: ${JSON.stringify(value)}`);
      }
    }

    // commentsテーブル
    log("commentsテーブル構造:");
    for (const [key, value] of Object.entries(comments)) {
      if (key !== "name") {
        log(`- ${key}: ${JSON.stringify(value)}`);
      }
    }

    log("=== スキーマ情報終了 ===");
  } catch (error) {
    log(`スキーマ情報取得エラー: ${String(error)}`);
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
    log(`db.jsonの読み込みに失敗しました: ${String(error)}`);
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
        log(`DB接続確認: ${JSON.stringify(pingResult)}`);
      } catch (pingError) {
        log(`DB接続エラー: ${String(pingError)}`);
      }

      // db.jsonからデータを読み込む
      const data = loadData();

      log("データベースのシードを開始します...");
      log("使用可能なテーブル: posts, comments, posts_comments, users");

      try {
        // 外部キー制約を一時的に無効化
        log("外部キー制約を一時的に無効化します...");
        await client`SET CONSTRAINTS ALL DEFERRED`;

        // 依存関係を考慮してテーブルデータをクリア（子→親の順）
        log("テーブルのデータをクリアしています...");

        // まずposts_commentsテーブルをクリア
        try {
          await client`TRUNCATE TABLE posts_comments CASCADE`;
          log("posts_commentsテーブルをクリアしました");
        } catch (error) {
          log(`posts_commentsテーブルのクリアに失敗: ${String(error)}`);
        }

        // 次にcommentsテーブルをクリア
        try {
          await client`TRUNCATE TABLE comments CASCADE`;
          log("commentsテーブルをクリアしました");
        } catch (error) {
          log(`commentsテーブルのクリアに失敗: ${String(error)}`);
        }

        // postsテーブルをクリア
        try {
          await client`TRUNCATE TABLE posts CASCADE`;
          log("postsテーブルをクリアしました");
        } catch (error) {
          log(`postsテーブルのクリアに失敗: ${String(error)}`);
        }

        // usersテーブルをクリア
        try {
          await client`TRUNCATE TABLE users CASCADE`;
          log("usersテーブルをクリアしました");
        } catch (error) {
          log(`usersテーブルのクリアに失敗: ${String(error)}`);
        }

        // 外部キー制約を再度有効化
        log("外部キー制約を再度有効化します...");
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

              log(`挿入データ(IDあり): ${JSON.stringify(userWithId)}`);

              try {
                // まずIDありでインサート試行
                await db.insert(users).values(userWithId);
                log(`users挿入成功(IDあり): ID=${user.id}`);
              } catch (idError) {
                log(`IDありでの挿入に失敗。IDなしで試行: ${String(idError)}`);
                // IDなしでインサート試行（自動採番の場合）
                await db.insert(users).values(userWithoutId);
                log(`users挿入成功(IDなし): ${JSON.stringify(userWithoutId)}`);
              }
            } catch (error) {
              log(`users挿入エラー: ${String(error)}`);
            }
          }
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

              log(`挿入データ(IDあり): ${JSON.stringify(postWithId)}`);

              try {
                // まずIDありでインサート試行
                await db.insert(posts).values(postWithId);
                log(`posts挿入成功(IDあり): ID=${post.id}`);
              } catch (idError) {
                log(`IDありでの挿入に失敗。IDなしで試行: ${String(idError)}`);
                // IDなしでインサート試行（自動採番の場合）
                await db.insert(posts).values(postWithoutId);
                log(`posts挿入成功(IDなし): ${JSON.stringify(postWithoutId)}`);
              }
            } catch (error) {
              log(`posts挿入エラー: ${String(error)}`);
            }
          }
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

              log(`挿入データ(IDあり): ${JSON.stringify(commentWithId)}`);

              try {
                // まずIDありでインサート試行
                await db.insert(comments).values(commentWithId);
                log(`comments挿入成功(IDあり): ID=${comment.id}`);
              } catch (idError) {
                log(`IDありでの挿入に失敗。IDなしで試行: ${String(idError)}`);
                // IDなしでインサート試行（自動採番の場合）
                await db.insert(comments).values(commentWithoutId);
                log(
                  `comments挿入成功(IDなし): ${JSON.stringify(commentWithoutId)}`,
                );
              }
            } catch (error) {
              log(`comments挿入エラー: ${String(error)}`);
            }
          }
        }

        // ネストされたコメントを挿入（posts_comments）
        if (data.posts && Array.isArray(data.posts)) {
          for (const post of data.posts) {
            if (post.comments && Array.isArray(post.comments)) {
              log(
                `投稿ID=${post.id}のコメント ${post.comments.length} 件を挿入します`,
              );
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

                  log(`挿入データ(IDあり): ${JSON.stringify(commentWithId)}`);

                  try {
                    // まずIDありでインサート試行
                    await db.insert(posts_comments).values(commentWithId);
                    log(`posts_comments挿入成功(IDあり): ID=${comment.id}`);
                  } catch (idError) {
                    log(
                      `IDありでの挿入に失敗。IDなしで試行: ${String(idError)}`,
                    );
                    // IDなしでインサート試行（自動採番の場合）
                    await db.insert(posts_comments).values(commentWithoutId);
                    log(
                      `posts_comments挿入成功(IDなし): ${JSON.stringify(commentWithoutId)}`,
                    );
                  }
                } catch (error) {
                  log(`posts_comments挿入エラー: ${String(error)}`);
                }
              }
            }
          }
        }

        // データ確認
        try {
          const userCount = await client`SELECT COUNT(*) FROM users`;
          log(`usersテーブルの行数: ${userCount[0].count}`);

          const postsCount = await client`SELECT COUNT(*) FROM posts`;
          log(`postsテーブルの行数: ${postsCount[0].count}`);

          const commentsCount = await client`SELECT COUNT(*) FROM comments`;
          log(`commentsテーブルの行数: ${commentsCount[0].count}`);

          const postsCommentsCount =
            await client`SELECT COUNT(*) FROM posts_comments`;
          log(`posts_commentsテーブルの行数: ${postsCommentsCount[0].count}`);
        } catch (error) {
          log(`テーブル行数確認エラー: ${String(error)}`);
        }
      } catch (error) {
        log(`シード処理中にエラーが発生しました: ${String(error)}`);
      }

      log("データベースのシードが完了しました");
      await client.end();
      return; // 成功したら関数を終了
    } catch (error) {
      lastError = error;
      log(`シード試行 ${i + 1}/${retries} 失敗: ${String(error)}`);

      if (i < retries - 1) {
        log(`${delay / 1000}秒後に再試行します...`);
        await sleep(delay);
      }
    }
  }

  // すべてのリトライが失敗した場合
  log(`シードが${retries}回試行後も失敗しました`);
  log(`最後のエラー: ${String(lastError)}`);
  process.exit(1);
}

// シードの実行
async function main() {
  log("データベースのシードを開始します...");
  await runSeed();
}

main();

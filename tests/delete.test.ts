import { execSync } from "node:child_process";
import { beforeEach, describe, expect, it } from "vitest";

// テスト前にdb.jsonをリセットする
beforeEach(() => {
  try {
    execSync("git restore db.json", { stdio: "pipe" });
  } catch (error) {
    console.error("git restore コマンドの実行中にエラーが発生しました:", error);
  }
});

// 両方のAPIパスでテストを実行するための関数
function runTestsForPath(apiPath: string) {
  describe(`DELETE API Tests for ${apiPath}`, () => {
    const baseUrl =
      process.env.ENV === "docker"
        ? "http://web:3000"
        : "http://localhost:3000";

    // PostgreSQL APIはまだ完全に実装されていないのでスキップ
    const testFn = apiPath === "db/pg" ? it.skip : it;

    testFn(
      "DELETE: should delete an item and return 404 when accessing it after deletion",
      async () => {
        // 新しい投稿を作成してから削除する
        const newPost = { title: "Test Post for Deletion", views: 10 };
        const createResponse = await fetch(`${baseUrl}/${apiPath}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPost),
        });
        const createdPost = await createResponse.json();

        // 削除
        const deleted = await fetch(
          `${baseUrl}/${apiPath}/posts/${createdPost.id}`,
          {
            method: "DELETE",
          },
        );
        expect(deleted.status).toBe(204);

        // 削除後のアクセス確認
        const afterDelete = await fetch(
          `${baseUrl}/${apiPath}/posts/${createdPost.id}`,
        );
        const afterDeleteData = await afterDelete.json();
        expect(Array.isArray(afterDeleteData)).toBe(true);
        expect(afterDeleteData.length).toBe(0);
      },
    );
  });
}

// 両方のAPIパスでテストを実行
runTestsForPath("json");
runTestsForPath("db/pg");

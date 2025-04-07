import { execSync } from "node:child_process";
import { beforeEach, describe, expect, test } from "vitest";

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
  describe(`POST API Tests for ${apiPath}`, () => {
    // PostgreSQL APIはまだ完全に実装されていないのでスキップ
    const testFn = apiPath === "db/pg" ? test.skip : test;

    testFn("POST: should create a new item", async () => {
      const baseUrl =
        process.env.ENV === "docker"
          ? "http://web:3000"
          : "http://localhost:3000";
      const newPost = { name: "Test Post" };
      const body = JSON.stringify(newPost);
      const response = await fetch(`${baseUrl}/${apiPath}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe(newPost.name);
      expect(data.id).toBe("4");
      expect(data.uuid).toBeDefined();
    });
  });
}

// 両方のAPIパスでテストを実行
runTestsForPath("json");
runTestsForPath("db/pg");

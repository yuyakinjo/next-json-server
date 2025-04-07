import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, test } from "vitest";

// オリジナルのdb.jsonの内容
const originalDb = {
  posts: [
    {
      id: "1",
      title: "harry potter",
      views: 100,
      comments: [
        { id: "1", text: "a comment about post 1", postsId: "1" },
        { id: "2", text: "another comment about post 1", postsId: "1" },
      ],
    },
    {
      id: "2",
      title: "starwars",
      views: 200,
      comments: [{ id: "3", text: "a comment about post 2", postsId: "2" }],
    },
    {
      id: "3",
      title: "another title",
      views: 300,
      comments: [],
    },
  ],
  comments: [
    { id: "1", text: "a comment about post 1", postsId: "1" },
    { id: "2", text: "another comment about post 1", postsId: "1" },
  ],
  users: [{ id: "1", name: "yuyakinjo" }],
};

// テスト前にdb.jsonをリセットする
beforeEach(() => {
  const dbPath = path.join(process.cwd(), "db.json");
  fs.writeFileSync(dbPath, JSON.stringify(originalDb, null, 2));
});

// 両方のAPIパスでテストを実行するための関数
function runTestsForPath(apiPath: string) {
  describe(`POST API Tests for ${apiPath}`, () => {
    test("POST: should create a new item", async () => {
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

import { describe, expect, it } from "vitest";

describe("DELETE API Tests", () => {
  const baseUrl =
    process.env.ENV === "docker" ? "http://web:3000" : "http://localhost:3000";

  it("DELETE: should delete an item and return 404 when accessing it after deletion", async () => {
    // 新しい投稿を作成してから削除する
    const newPost = { title: "Test Post for Deletion", views: 10 };
    const createResponse = await fetch(`${baseUrl}/json/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
    });
    const createdPost = await createResponse.json();

    // 削除
    const deleted = await fetch(`${baseUrl}/json/posts/${createdPost.id}`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(204);

    // 削除後のアクセス確認
    const afterDelete = await fetch(`${baseUrl}/json/posts/${createdPost.id}`);
    const afterDeleteData = await afterDelete.json();
    expect(Array.isArray(afterDeleteData)).toBe(true);
    expect(afterDeleteData.length).toBe(0);
  });
});

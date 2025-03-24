import { describe, expect, it } from "vitest";

type Post = {
  id: string;
  title: string;
  views: number;
};

// JSONレスポンスを取得するための関数
async function getJsonResponse<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json();
}

describe("PUT API Tests", () => {
  const baseUrl =
    process.env.ENV === "docker" ? "http://web:3000" : "http://localhost:3000";

  it("PUT: should update an item", async () => {
    const updatedItem = { id: "1", title: "Updated Item", views: 100 };
    const body = JSON.stringify(updatedItem);
    const response = await fetch(`${baseUrl}/json/posts/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.title).toBe(updatedItem.title);
    expect(data.views).toBe(updatedItem.views);

    // 元に戻す
    const originalItem = { id: "1", title: "starwars", views: 254 };
    await fetch(`${baseUrl}/json/posts/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(originalItem),
    });
  });
});

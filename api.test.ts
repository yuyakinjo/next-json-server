import { describe, expect, it } from "bun:test";

describe("API Tests", () => {
  const baseUrl =
    process.env.ENV === "docker" ? "http://web:3000" : "http://localhost:3000";

  it("GET List: should return a list of posts", async () => {
    const response = await fetch(`${baseUrl}/json/posts`);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("GET Item: should return a single post", async () => {
    const response = await fetch(`${baseUrl}/json/posts/1`);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.id).toBe("1");
  });

  it("POST: should create a new item", async () => {
    const newItem = { name: "Test Item" };
    const body = JSON.stringify(newItem);
    const response = await fetch(`${baseUrl}/json/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data.name).toBe(newItem.name);
  });

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
  });

  it("DELETE: should delete an item", async () => {
    const deleted = await fetch(`${baseUrl}/json/posts/1`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(204);
    const afterDelete = await fetch(`${baseUrl}/json/posts/1`, {
      method: "GET",
    });
    expect(afterDelete.status).toBe(404);
  });
});

import { describe, expect, it } from "vitest";

describe("API Tests", () => {
  it("should return a list of posts", async () => {
    const response = await fetch("http://localhost:3000/json/posts");
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("should create a new item", async () => {
    const newItem = { name: "Test Item" };
    const response = await fetch("http://localhost:3000/json/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newItem),
    });
    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data.name).toBe(newItem.name);
  });

  it("should update an item", async () => {
    const updatedItem = { id: "1", title: "Updated Item", views: 100 };
    const response = await fetch("http://localhost:3000/json/posts/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedItem),
    });
    const data = await response.json();
    console.dir(data);
    expect(response.status).toBe(200);
    expect(data.title).toBe(updatedItem.title);
    expect(data.views).toBe(updatedItem.views);
  });

  it("should delete an item", async () => {
    const response = await fetch("http://localhost:3000/json/posts/2", {
      method: "DELETE",
    });
    expect(response.status).toBe(204);
  });
});

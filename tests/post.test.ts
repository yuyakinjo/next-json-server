import { expect, test } from "vitest";

test("POST: should create a new item", async () => {
  const baseUrl =
    process.env.ENV === "docker" ? "http://web:3000" : "http://localhost:3000";
  const newPost = { name: "Test Post" };
  const body = JSON.stringify(newPost);
  const response = await fetch(`${baseUrl}/json/posts`, {
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

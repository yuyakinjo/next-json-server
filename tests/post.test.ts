import { describe, expect, it } from "vitest";

it("POST: should create a new item", async () => {
  const baseUrl =
    process.env.ENV === "docker" ? "http://web:3000" : "http://localhost:3000";
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

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

describe("API Tests", () => {
  const baseUrl =
    process.env.ENV === "docker" ? "http://web:3000" : "http://localhost:3000";

  it("GET List: should return a list of posts", async () => {
    const data = await getJsonResponse<Post[]>(`${baseUrl}/json/posts`);
    expect(data.length).toBeGreaterThan(0);
  });

  it("GET Item: should return a single post", async () => {
    const data = await getJsonResponse<Post>(`${baseUrl}/json/posts/1`);
    expect(Array.isArray(data)).toBe(false);
    expect(data.id).toBe("1");
  });

  it("GET Multiple IDs: should return posts with IDs 1 and 2", async () => {
    const data = await getJsonResponse<Post[]>(
      `${baseUrl}/json/posts?id=1&id=2`,
    );
    expect(data.length).toBe(2);
    expect(data[0].id).toBe("1");
    expect(data[1].id).toBe("2");
  });

  it("GET by Title: should return posts with title 'starwars'", async () => {
    const data = await getJsonResponse<Post[]>(
      `${baseUrl}/json/posts?title=starwars`,
    );
    expect(data.length).toBe(1);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].title).toBe("starwars");
  });

  it("GET Comments for Post: should return comments for post ID 1", async () => {
    const data = await getJsonResponse<Comment[]>(
      `${baseUrl}/json/posts/1/comments`,
    );
    expect(Array.isArray(data)).toBe(true);
  });

  it("GET Greater Than Views: should return posts with views greater than 100", async () => {
    const data = await getJsonResponse<Post[]>(
      `${baseUrl}/json/posts?gt_views=100`,
    );
    expect(data.every((post: Post) => post.views > 100)).toBe(true);
  });

  it("GET Less Than Views: should return posts with views less than 100", async () => {
    const data = await getJsonResponse<Post[]>(
      `${baseUrl}/json/posts?lt_views=100`,
    );
    expect(data.every((post: Post) => post.views < 100)).toBe(true);
  });

  it("GET Greater Than or Equal Views: should return posts with views greater than or equal to 100", async () => {
    const data = await getJsonResponse<Post[]>(
      `${baseUrl}/json/posts?gte_views=100`,
    );
    expect(data.every((post: Post) => post.views >= 100)).toBe(true);
  });

  it("GET Less Than or Equal Views: should return posts with views less than or equal to 100", async () => {
    const data = await getJsonResponse<Post[]>(
      `${baseUrl}/json/posts?lte_views=100`,
    );
    expect(data.every((post: Post) => post.views <= 100)).toBe(true);
  });

  it("GET Not Equal Views: should return posts with views not equal to 100", async () => {
    const data = await getJsonResponse<Post[]>(
      `${baseUrl}/json/posts?ne_views=100`,
    );
    expect(data.every((post: Post) => post.views !== 100)).toBe(true);
  });

  it("GET In Views: should return posts with views in 100 or 200", async () => {
    const data = await getJsonResponse<Post[]>(
      `${baseUrl}/json/posts?in_views=100,200`,
    );
    expect(data.every((post: Post) => [100, 200].includes(post.views))).toBe(
      true,
    );
  });

  // it("POST: should create a new item", async () => {
  //   const newItem = { name: "Test Item" };
  //   const body = JSON.stringify(newItem);
  //   const response = await fetch(`${baseUrl}/json/posts`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body,
  //   });
  //   const data = await response.json();
  //   expect(response.status).toBe(201);
  //   expect(data.name).toBe(newItem.name);
  // });

  // it("PUT: should update an item", async () => {
  //   const updatedItem = { id: "1", title: "Updated Item", views: 100 };
  //   const body = JSON.stringify(updatedItem);
  //   const response = await fetch(`${baseUrl}/json/posts/1`, {
  //     method: "PUT",
  //     headers: { "Content-Type": "application/json" },
  //     body,
  //   });
  //   const data = await response.json();
  //   expect(response.status).toBe(200);
  //   expect(data.title).toBe(updatedItem.title);
  //   expect(data.views).toBe(updatedItem.views);
  // });

  // it("DELETE: should delete an item", async () => {
  //   const deleted = await fetch(`${baseUrl}/json/posts/1`, {
  //     method: "DELETE",
  //   });
  //   expect(deleted.status).toBe(204);
  //   const afterDelete = await fetch(`${baseUrl}/json/posts/1`, {
  //     method: "GET",
  //   });
  //   expect(afterDelete.status).toBe(404);
  // });
});

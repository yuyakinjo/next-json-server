import { describe, expect, it } from "vitest";

// デバッグ情報
console.log("テスト環境:", process.env.ENV);
console.log("Node環境:", process.env.NODE_ENV);
console.log("データベースURL:", process.env.DATABASE_URL);

type Post = {
  id: number;
  title: string;
  views: number;
  created_at?: string;
  updated_at?: string;
};

type Comment = {
  id: number;
  text: string;
  postsId: number;
  created_at?: string;
  updated_at?: string;
};

type User = {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
};

// JSONレスポンスを取得するための関数
async function getJsonResponse<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

describe("PostgreSQL API Tests", () => {
  const baseUrl =
    process.env.ENV === "docker" ? "http://web:3000" : "http://localhost:3000";
  const apiBase = `${baseUrl}/db/pg`;

  it("GET List: should return a list of posts", async () => {
    const data = await getJsonResponse<Post[]>(`${apiBase}/posts`);
    expect(data.length).toBeGreaterThan(0);
  });

  it("GET Item: should return empty array or error for not exist property", async () => {
    try {
      await getJsonResponse<unknown>(`${apiBase}/notexist`);
    } catch (error) {
      // APIが存在しないパスで404または500を返すことを期待
      expect(error).toBeDefined();
    }
  });

  it("GET Item: should return a single post", async () => {
    const posts = await getJsonResponse<Post[]>(`${apiBase}/posts`);
    if (posts.length > 0) {
      const postId = posts[0].id;
      const data = await getJsonResponse<Post>(`${apiBase}/posts/${postId}`);
      expect(Array.isArray(data)).toBe(false);
      expect(data.id).toBe(postId);
    }
  });

  it("GET Query ID: should return post with specific ID", async () => {
    const posts = await getJsonResponse<Post[]>(`${apiBase}/posts`);
    if (posts.length > 0) {
      const postId = posts[0].id;
      const data = await getJsonResponse<Post[]>(
        `${apiBase}/posts?id=${postId}`,
      );
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].id).toBe(postId);
    }
  });

  it("GET by Title: should return posts with specific title", async () => {
    const posts = await getJsonResponse<Post[]>(`${apiBase}/posts`);
    if (posts.length > 0) {
      const title = posts[0].title;
      const data = await getJsonResponse<Post[]>(
        `${apiBase}/posts?title=${encodeURIComponent(title)}`,
      );
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data.every((post) => post.title === title)).toBe(true);
    }
  });

  it("GET Greater Than Views: should return posts with views greater than specific value", async () => {
    const posts = await getJsonResponse<Post[]>(`${apiBase}/posts`);
    if (posts.length > 0) {
      // 最小のビュー数を取得
      const minViews = Math.min(...posts.map((post) => post.views));
      if (minViews > 0) {
        const threshold = minViews - 1;
        const data = await getJsonResponse<Post[]>(
          `${apiBase}/posts?gt_views=${threshold}`,
        );
        expect(data.every((post) => post.views > threshold)).toBe(true);
      }
    }
  });

  it("GET Less Than Views: should return posts with views less than specific value", async () => {
    const posts = await getJsonResponse<Post[]>(`${apiBase}/posts`);
    if (posts.length > 0) {
      // 最大のビュー数を取得
      const maxViews = Math.max(...posts.map((post) => post.views));
      const threshold = maxViews + 1;
      const data = await getJsonResponse<Post[]>(
        `${apiBase}/posts?lt_views=${threshold}`,
      );
      expect(data.every((post) => post.views < threshold)).toBe(true);
    }
  });

  it("GET Users: should return all users", async () => {
    const data = await getJsonResponse<User[]>(`${apiBase}/users`);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("name");
  });

  it("GET Specific User: should return a specific user", async () => {
    const users = await getJsonResponse<User[]>(`${apiBase}/users`);
    if (users.length > 0) {
      const userId = users[0].id;
      const user = await getJsonResponse<User>(`${apiBase}/users/${userId}`);
      expect(user).toHaveProperty("id", userId);
      expect(user).toHaveProperty("name");
    }
  });

  it("GET Comments: should return all comments", async () => {
    const data = await getJsonResponse<Comment[]>(`${apiBase}/comments`);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("text");
    expect(data[0]).toHaveProperty("postsId");
  });

  it("GET Comments for Post: should return comments for a specific post", async () => {
    const comments = await getJsonResponse<Comment[]>(`${apiBase}/comments`);
    if (comments.length > 0) {
      const postsId = comments[0].postsId;
      const data = await getJsonResponse<Comment[]>(
        `${apiBase}/comments?postsId=${postsId}`,
      );
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data.every((comment) => comment.postsId === postsId)).toBe(true);
    }
  });
});

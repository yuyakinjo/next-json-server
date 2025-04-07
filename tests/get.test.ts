import { describe, expect, it } from "vitest";

type Post = {
  id: string;
  title: string;
  views: number;
};

type Comment = {
  id: string;
  text: string;
  postId: string;
};

// JSONレスポンスを取得するための関数
async function getJsonResponse<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json();
}

// 両方のAPIパスでテストを実行するための関数
function runTestsForPath(apiPath: string) {
  describe(`GET API Tests for ${apiPath}`, () => {
    const baseUrl =
      process.env.ENV === "docker"
        ? "http://web:3000"
        : "http://localhost:3000";

    it("GET List: should return a list of posts", async () => {
      const data = await getJsonResponse<Post[]>(`${baseUrl}/${apiPath}/posts`);
      expect(data.length).toBeGreaterThan(0);
    });

    it("GET Item: should return empty array for not exist property", async () => {
      const data = await getJsonResponse<[]>(`${baseUrl}/${apiPath}/notexist`);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it("GET Item: should return a single post", async () => {
      const data = await getJsonResponse<Post>(`${baseUrl}/${apiPath}/posts/1`);
      expect(Array.isArray(data)).toBe(false);
      expect(data.id).toBe("1");
    });

    it("GET Comments for Post: should return comments for post ID 1", async () => {
      const data = await getJsonResponse<Comment[]>(
        `${baseUrl}/${apiPath}/posts/1/comments`,
      );
      expect(Array.isArray(data)).toBe(true);
    });

    it("GET Comment for Post: should return comment for post ID 1", async () => {
      const data = await getJsonResponse<Comment[]>(
        `${baseUrl}/${apiPath}/posts/1/comments/1`,
      );
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it("GET Comment for Post: should return empty array for post ID 2", async () => {
      const data = await getJsonResponse<Comment[]>(
        `${baseUrl}/${apiPath}/posts/2/comments/1`,
      );
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it("GET Comment for Post: should return empty array for post ID 3", async () => {
      const data = await getJsonResponse<Comment[]>(
        `${baseUrl}/${apiPath}/posts/3/comments/1`,
      );
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it("GET Query ID: should return post ID 1", async () => {
      const data = await getJsonResponse<Post[]>(
        `${baseUrl}/${apiPath}/posts?id=1`,
      );
      expect(data.length).toBe(1);
      expect(data[0].id).toBe("1");
    });

    it("GET Multiple IDs: should return posts with IDs 1 and 2", async () => {
      const data = await getJsonResponse<Post[]>(
        `${baseUrl}/${apiPath}/posts?id=1&id=2`,
      );
      expect(data.length).toBe(2);
      expect(data[0].id).toBe("1");
      expect(data[1].id).toBe("2");
    });

    it("GET by Title: should return posts with title 'starwars'", async () => {
      const data = await getJsonResponse<Post[]>(
        `${baseUrl}/${apiPath}/posts?title=starwars`,
      );
      expect(data.length).toBe(2);
      expect(Array.isArray(data)).toBe(true);
      expect(data.every((post) => post.title === "starwars")).toBe(true);
    });

    it("GET Greater Than Views: should return posts with views greater than 100", async () => {
      const data = await getJsonResponse<Post[]>(
        `${baseUrl}/${apiPath}/posts?gt_views=100`,
      );
      expect(data.every((post: Post) => post.views > 100)).toBe(true);
    });

    it("GET Less Than Views: should return posts with views less than 100", async () => {
      const data = await getJsonResponse<Post[]>(
        `${baseUrl}/${apiPath}/posts?lt_views=100`,
      );
      expect(data.every((post: Post) => post.views < 100)).toBe(true);
    });

    it("GET Greater Than or Equal Views: should return posts with views greater than or equal to 100", async () => {
      const data = await getJsonResponse<Post[]>(
        `${baseUrl}/${apiPath}/posts?gte_views=100`,
      );
      expect(data.every((post: Post) => post.views >= 100)).toBe(true);
    });

    it("GET Less Than or Equal Views: should return posts with views less than or equal to 100", async () => {
      const data = await getJsonResponse<Post[]>(
        `${baseUrl}/${apiPath}/posts?lte_views=100`,
      );
      expect(data.every((post: Post) => post.views <= 100)).toBe(true);
    });

    it("GET Not Equal Views: should return posts with views not equal to 100", async () => {
      const data = await getJsonResponse<Post[]>(
        `${baseUrl}/${apiPath}/posts?ne_views=100`,
      );
      expect(data.every((post: Post) => post.views !== 100)).toBe(true);
    });

    it("GET In Views: should return posts with views in 100 or 200", async () => {
      const data = await getJsonResponse<Post[]>(
        `${baseUrl}/${apiPath}/posts?in_views=100,200`,
      );
      expect(data.every((post: Post) => [100, 200].includes(post.views))).toBe(
        true,
      );
    });
  });
}

// 両方のAPIパスでテストを実行
runTestsForPath("json");
runTestsForPath("db/pg");

import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// このファイルはdb.jsonから自動生成されました
// 生成日時: 2025-04-07T01:39:30.440Z

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title"),
  views: integer("views"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts_comments = pgTable("posts_comments", {
  id: serial("id").primaryKey(),
  postsId: integer("posts_id").references(() => posts.id),
  text: text("text"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  text: text("text"),
  postsId: integer("postsId").references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// リレーション関数
import { eq } from "drizzle-orm";

// 簡略化したデータベースクライアントインターフェース
type DbQueryResult = unknown;
type DbTable = unknown;
type DbCondition = unknown;

interface DbClient {
  select: () => {
    from: (table: DbTable) => {
      where: (condition: DbCondition) => DbQueryResult;
    };
  };
}

// データベース操作関数
export const getposts_comments = (db: DbClient, postsId: number) => {
  return db
    .select()
    .from(posts_comments)
    .where(eq(posts_comments.postsId, postsId));
};

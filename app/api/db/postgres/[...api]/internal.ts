import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// 環境変数からデータベース接続情報を取得
const connectionString = process.env.DATABASE_URL;

// クライアント接続の初期化
let client: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;

/**
 * DrizzleORMのデータベースインスタンスを取得する
 * @returns DrizzleORMのデータベースインスタンス
 */
export function getDb() {
  if (!db) {
    if (!connectionString) {
      throw new Error("環境変数DATABASE_URLが設定されていません");
    }

    client = postgres(connectionString, {
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });

    db = drizzle(client);
  }

  return db;
}

/**
 * テーブル内のすべてのレコードを取得する
 * @param tableName テーブル名
 * @returns テーブル内のすべてのレコード
 */
export async function getAllRecords(tableName: string) {
  const db = getDb();
  const query = sql`SELECT * FROM ${sql.identifier(tableName)}`;
  return await db.execute(query);
}

/**
 * IDに基づいてレコードを取得する
 * @param tableName テーブル名
 * @param id レコードID
 * @returns 指定されたIDのレコード
 */
export async function getRecordById(tableName: string, id: string) {
  const db = getDb();
  const query = sql`
    SELECT * FROM ${sql.identifier(tableName)} WHERE id = ${id}
  `;
  const results = await db.execute(query);
  return results[0] || null;
}

/**
 * 検索条件に基づいてレコードをフィルタリングする
 * @param tableName テーブル名
 * @param searchParams 検索パラメータ
 * @returns フィルタリングされたレコード
 */
export async function filterRecordsBySearchParams(
  tableName: string,
  searchParams: URLSearchParams,
) {
  const db = getDb();

  // 初期クエリ構築
  let query = sql`SELECT * FROM ${sql.identifier(tableName)}`;
  let whereClause = sql``;
  const conditions: Array<ReturnType<typeof sql>> = [];

  // 検索条件を構築
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("gt_")) {
      const field = key.replace("gt_", "");
      conditions.push(sql`${sql.identifier(field)} > ${value}`);
    } else if (key.startsWith("lt_")) {
      const field = key.replace("lt_", "");
      conditions.push(sql`${sql.identifier(field)} < ${value}`);
    } else if (key.startsWith("gte_")) {
      const field = key.replace("gte_", "");
      conditions.push(sql`${sql.identifier(field)} >= ${value}`);
    } else if (key.startsWith("lte_")) {
      const field = key.replace("lte_", "");
      conditions.push(sql`${sql.identifier(field)} <= ${value}`);
    } else if (key.startsWith("ne_")) {
      const field = key.replace("ne_", "");
      conditions.push(sql`${sql.identifier(field)} <> ${value}`);
    } else if (key.startsWith("in_")) {
      const field = key.replace("in_", "");
      const inValues = value.split(",");
      conditions.push(sql`${sql.identifier(field)} IN (${sql.join(inValues)})`);
    } else {
      conditions.push(sql`${sql.identifier(key)} = ${value}`);
    }
  }

  // WHERE句を生成
  if (conditions.length > 0) {
    whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;
    query = sql`${query} ${whereClause}`;
  }

  // クエリを実行
  return await db.execute(query);
}

/**
 * 新しいレコードを作成する
 * @param tableName テーブル名
 * @param data レコードデータ
 * @returns 作成されたレコード
 */
export async function createRecord(
  tableName: string,
  data: Record<string, unknown>,
) {
  const db = getDb();

  const fields = Object.keys(data);
  const values = Object.values(data);

  // INSERT文を構築
  const columnsSQL = sql.join(
    fields.map((field) => sql.identifier(field)),
    sql`, `,
  );

  const valuesSQL = sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  );

  const query = sql`
    INSERT INTO ${sql.identifier(tableName)} (${columnsSQL})
    VALUES (${valuesSQL})
    RETURNING *
  `;

  const results = await db.execute(query);
  return results[0] || null;
}

/**
 * レコードを更新する
 * @param tableName テーブル名
 * @param id レコードID
 * @param data 更新データ
 * @returns 更新されたレコード
 */
export async function updateRecord(
  tableName: string,
  id: string,
  data: Record<string, unknown>,
) {
  const db = getDb();

  const fields = Object.keys(data);
  const values = Object.values(data);

  // SET句の構築
  const setExpressions = fields.map((field, index) => {
    return sql`${sql.identifier(field)} = ${values[index]}`;
  });

  const setClause = sql.join(setExpressions, sql`, `);

  const query = sql`
    UPDATE ${sql.identifier(tableName)}
    SET ${setClause}
    WHERE id = ${id}
    RETURNING *
  `;

  const results = await db.execute(query);
  return results[0] || null;
}

/**
 * レコードを削除する
 * @param tableName テーブル名
 * @param id レコードID
 * @returns 削除されたレコード数
 */
export async function deleteRecord(tableName: string, id: string) {
  const db = getDb();

  const query = sql`
    DELETE FROM ${sql.identifier(tableName)} WHERE id = ${id} RETURNING *
  `;

  const results = await db.execute(query);
  return results.length;
}

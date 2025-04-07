#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// パスの設定
const workDir = process.cwd();
const dbJsonPath = path.join(workDir, "db.json");
const schemaPath = path.join(
  workDir,
  "app",
  "api",
  "db",
  "postgres",
  "schema",
  "index.ts",
);

// データの型を推測する関数
function inferType(value: unknown): { drizzleType: string; tsType: string } {
  if (value === null) {
    return { drizzleType: "text", tsType: "string | null" };
  }

  switch (typeof value) {
    case "string":
      // 文字列が日付形式かどうかを確認
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(value)) {
        return { drizzleType: "timestamp", tsType: "Date" };
      }
      return { drizzleType: "text", tsType: "string" };

    case "number":
      // 整数か小数かを確認
      if (Number.isInteger(value)) {
        return { drizzleType: "integer", tsType: "number" };
      }
      return { drizzleType: "real", tsType: "number" };

    case "boolean":
      return { drizzleType: "boolean", tsType: "boolean" };

    case "object":
      if (Array.isArray(value)) {
        // 配列は一対多のリレーションシップとして扱わない
        // (別途テーブルとして生成する)
        return { drizzleType: "json", tsType: "unknown[]" };
      }
      // オブジェクトはJSONとして保存
      return { drizzleType: "jsonb", tsType: "Record<string, unknown>" };

    default:
      return { drizzleType: "text", tsType: "string" };
  }
}

// スキーマ生成のメイン関数
async function generateSchema() {
  try {
    console.log("db.jsonからスキーマを生成しています...");

    // db.jsonを読み込む
    const dbJsonContent = readFileSync(dbJsonPath, "utf-8");
    const dbData = JSON.parse(dbJsonContent);

    // スキーマの先頭部分（インポート文）
    let schemaContent = `import { pgTable, serial, text, integer, real, boolean, timestamp, jsonb, json } from "drizzle-orm/pg-core";

// このファイルはdb.jsonから自動生成されました
// 生成日時: ${new Date().toISOString()}

`;

    // テーブルの定義と関連を格納する配列
    const tableDefinitions: string[] = [];
    const relations: string[] = [];

    // 各テーブル（db.jsonのトップレベルキー）を処理
    for (const [tableName, tableData] of Object.entries(dbData)) {
      if (!Array.isArray(tableData) || tableData.length === 0) {
        console.log(
          `警告: ${tableName}はテーブルとして適切なデータ構造ではありません。スキップします。`,
        );
        continue;
      }

      // 最初のオブジェクトをサンプルとして使用
      const sampleObject = tableData[0];

      // カラムの定義を格納する配列
      const columns: string[] = [];

      // IDカラムを最初に追加（通常は主キー）
      columns.push(`  id: serial("id").primaryKey(),`);

      // 各プロパティをカラムとして追加
      for (const [propName, propValue] of Object.entries(sampleObject)) {
        // idカラムはすでに追加済みのためスキップ
        if (propName === "id") continue;

        // 配列の場合は別テーブルとして扱うためスキップ
        if (Array.isArray(propValue)) continue;

        // 外部キーと思われるプロパティを検出（名前が他のテーブル名+Idの形式）
        const isReference = propName.endsWith("Id") || propName.endsWith("Ids");
        if (isReference) {
          const refTableName = propName.replace(/Id(s)?$/, "");
          if (dbData[refTableName]) {
            // 外部キーとして定義 (整数型に変更)
            columns.push(
              `  ${propName}: integer("${propName}").references(() => ${refTableName}.id),`,
            );
            continue;
          }
        }

        // 通常のカラムとして追加
        const { drizzleType, tsType } = inferType(propValue);
        columns.push(`  ${propName}: ${drizzleType}("${propName}"),`);
      }

      // 作成日時と更新日時の追加（一般的なカラム）
      columns.push(`  createdAt: timestamp("created_at").defaultNow(),`);
      columns.push(`  updatedAt: timestamp("updated_at").defaultNow(),`);

      // テーブル定義の作成
      const tableDefinition = `export const ${tableName} = pgTable("${tableName}", {
${columns.join("\n")}
});`;

      tableDefinitions.push(tableDefinition);

      // ネストされた配列について関連テーブルを作成
      for (const [propName, propValue] of Object.entries(sampleObject)) {
        if (Array.isArray(propValue) && propValue.length > 0) {
          // 中間テーブル名を作成
          const relatedTableName = `${tableName}_${propName}`;

          // 関連テーブルのカラム
          const relatedColumns: string[] = [];
          relatedColumns.push(`  id: serial("id").primaryKey(),`);
          relatedColumns.push(
            `  ${tableName}Id: integer("${tableName}_id").references(() => ${tableName}.id),`,
          );

          // 最初のオブジェクトをサンプルに
          const sampleRelatedObj = propValue[0];

          // 関連プロパティをカラムとして追加
          for (const [relPropName, relPropValue] of Object.entries(
            sampleRelatedObj,
          )) {
            // idとすでに追加した外部キーはスキップ
            if (relPropName === "id" || relPropName === `${tableName}Id`)
              continue;

            // 型の推測
            const { drizzleType } = inferType(relPropValue);
            relatedColumns.push(
              `  ${relPropName}: ${drizzleType}("${relPropName}"),`,
            );
          }

          // タイムスタンプカラムの追加
          relatedColumns.push(
            `  createdAt: timestamp("created_at").defaultNow(),`,
          );
          relatedColumns.push(
            `  updatedAt: timestamp("updated_at").defaultNow(),`,
          );

          // 関連テーブルの定義
          const relatedTableDefinition = `export const ${relatedTableName} = pgTable("${relatedTableName}", {
${relatedColumns.join("\n")}
});`;

          tableDefinitions.push(relatedTableDefinition);

          // リレーション関数の定義
          const relationFunction = `
export const get${relatedTableName} = (db, ${tableName}Id) => {
  return db.select().from(${relatedTableName}).where(eq(${relatedTableName}.${tableName}Id, ${tableName}Id));
};`;

          relations.push(relationFunction);
        }
      }
    }

    // スキーマファイルの内容を作成
    schemaContent += tableDefinitions.join("\n\n");

    // リレーション関数を追加
    if (relations.length > 0) {
      schemaContent +=
        "\n\n// リレーション関数\nimport { eq } from 'drizzle-orm';\n";
      schemaContent += relations.join("\n");
    }

    // スキーマファイルを書き込む
    writeFileSync(schemaPath, schemaContent);
    console.log(`スキーマファイルを生成しました: ${schemaPath}`);

    console.log("スキーマの生成が完了しました");
    console.log("次のステップ:");
    console.log(
      "1. bun run db:generate を実行してマイグレーションファイルを生成",
    );
    console.log("2. bun run db:migrate を実行してマイグレーションを適用");
  } catch (error) {
    console.error("スキーマ生成中にエラーが発生しました:", error);
    process.exit(1);
  }
}

// スクリプトの実行
generateSchema();

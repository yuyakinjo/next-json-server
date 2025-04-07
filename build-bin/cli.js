#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];
// コマンドの使用方法を表示する関数
function showHelp() {
    console.log(`
  Usage: next-json-server [command]

  Commands:
    generate json         - JSONルートを生成します
    generate db/postgres  - PostgreSQLルートを生成します (DrizzleORM使用)
    help                  - このヘルプメッセージを表示します
  `);
}
// ディレクトリを確認して、必要であれば作成する関数
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`ディレクトリを作成しました: ${dirPath}`);
    }
}
// JSONルートを生成する関数
function generateJsonRoute() {
    const cwd = process.cwd();
    const targetDir = path.join(cwd, "app", "json", "[...api]");
    // db.jsonの存在確認
    const dbJsonPath = path.join(cwd, "db.json");
    if (!fs.existsSync(dbJsonPath)) {
        console.error("Error: db.jsonが見つかりません。先にdb.jsonを作成してください。");
        process.exit(1);
    }
    // ディレクトリの確認と作成
    ensureDirectoryExists(targetDir);
    // internal.tsの生成
    const internalTsContent = fs.readFileSync(path.join(__dirname, "../templates/json/internal.ts"), "utf-8");
    fs.writeFileSync(path.join(targetDir, "internal.ts"), internalTsContent);
    console.log("生成しました: internal.ts");
    // route.tsの生成
    const routeTsContent = fs.readFileSync(path.join(__dirname, "../templates/json/route.ts"), "utf-8");
    fs.writeFileSync(path.join(targetDir, "route.ts"), routeTsContent);
    console.log("生成しました: route.ts");
    console.log("\n✅ JSONルートの生成が完了しました!");
    console.log("次のステップ:");
    console.log("  1. `npm run dev` または `yarn dev` を実行してサーバーを起動");
    console.log("  2. http://localhost:3000/json/{リソース名} にアクセスしてAPIを使用");
}
// PostgreSQLルートを生成する関数
function generatePostgresRoute() {
    const cwd = process.cwd();
    const targetDir = path.join(cwd, "app", "api", "db", "postgres", "[...api]");
    const schemaDir = path.join(cwd, "app", "api", "db", "postgres", "schema");
    // ディレクトリの確認と作成
    ensureDirectoryExists(targetDir);
    ensureDirectoryExists(schemaDir);
    // internal.tsの生成
    const pgInternalTsContent = fs.readFileSync(path.join(__dirname, "../templates/pg/internal.ts"), "utf-8");
    fs.writeFileSync(path.join(targetDir, "internal.ts"), pgInternalTsContent);
    console.log("生成しました: internal.ts");
    // route.tsの生成
    const pgRouteTsContent = fs.readFileSync(path.join(__dirname, "../templates/pg/route.ts"), "utf-8");
    fs.writeFileSync(path.join(targetDir, "route.ts"), pgRouteTsContent);
    console.log("生成しました: route.ts");
    // schema/index.tsの生成（サンプルスキーマ）
    const schemaContent = `import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// サンプルテーブル定義
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
`;
    fs.writeFileSync(path.join(schemaDir, "index.ts"), schemaContent);
    console.log("生成しました: schema/index.ts (サンプルスキーマ)");
    console.log("\n✅ PostgreSQL+DrizzleORM ルートの生成が完了しました!");
    console.log("次のステップ:");
    console.log("  1. PostgreSQLの接続情報を.env.localに設定");
    console.log("    DATABASE_URL=postgresql://user:password@localhost:5432/dbname");
    console.log("  2. schema/index.tsでテーブル定義をカスタマイズ");
    console.log("  3. `npm run dev` または `yarn dev` を実行してサーバーを起動");
    console.log("  4. http://localhost:3000/db/pg/{テーブル名} にアクセスしてAPIを使用");
}
// メインロジック
if (command === "generate" && subCommand === "json") {
    generateJsonRoute();
}
else if (command === "generate" && subCommand === "db/postgres") {
    generatePostgresRoute();
}
else if (command === "help" || !command) {
    showHelp();
}
else {
    console.error(`Error: 不明なコマンド '${command}'`);
    showHelp();
    process.exit(1);
}

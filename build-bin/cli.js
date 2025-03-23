#!/usr/bin/env node
const __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (o, m, k, k2) => {
        if (k2 === undefined) k2 = k;
        let desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = { enumerable: true, get: () => m[k] };
        }
        Object.defineProperty(o, k2, desc);
      }
    : (o, m, k, k2) => {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
const __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (o, v) => {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : (o, v) => {
        o.default = v;
      });
const __importStar =
  (this && this.__importStar) ||
  (() => {
    let ownKeys = (o) => {
      ownKeys =
        Object.getOwnPropertyNames ||
        ((o) => {
          const ar = [];
          for (const k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        });
      return ownKeys(o);
    };
    return (mod) => {
      if (mod?.__esModule) return mod;
      const result = {};
      if (mod != null)
        for (let k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
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
    generate json   - JSONルートを生成します
    help            - このヘルプメッセージを表示します
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
    console.error(
      "Error: db.jsonが見つかりません。先にdb.jsonを作成してください。",
    );
    process.exit(1);
  }
  // ディレクトリの確認と作成
  ensureDirectoryExists(targetDir);
  // internal.tsの生成
  const internalTsContent = fs.readFileSync(
    path.join(__dirname, "../templates/internal.ts"),
    "utf-8",
  );
  fs.writeFileSync(path.join(targetDir, "internal.ts"), internalTsContent);
  console.log("生成しました: internal.ts");
  // route.tsの生成
  const routeTsContent = fs.readFileSync(
    path.join(__dirname, "../templates/route.ts"),
    "utf-8",
  );
  fs.writeFileSync(path.join(targetDir, "route.ts"), routeTsContent);
  console.log("生成しました: route.ts");
  console.log("\n✅ JSONルートの生成が完了しました!");
  console.log("次のステップ:");
  console.log("  1. `npm run dev` または `yarn dev` を実行してサーバーを起動");
  console.log(
    "  2. http://localhost:3000/json/{リソース名} にアクセスしてAPIを使用",
  );
}
// メインロジック
if (command === "generate" && subCommand === "json") {
  generateJsonRoute();
} else if (command === "help" || !command) {
  showHelp();
} else {
  console.error(`Error: 不明なコマンド '${command}'`);
  showHelp();
  process.exit(1);
}

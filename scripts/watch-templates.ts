#!/usr/bin/env node

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// 最後の実行時刻を追跡する
let lastRunTime = 0;
const debounceTime = 300; // ミリ秒

// 監視するディレクトリのパス
const templatesDir = path.join(process.cwd(), "templates");

// テンプレートディレクトリが存在するか確認
if (!fs.existsSync(templatesDir)) {
  console.error("Error: templates ディレクトリが見つかりません。");
  process.exit(1);
}

console.log("templates ディレクトリの監視を開始しました...");
console.log("ファイルが変更されると自動的に generate コマンドが実行されます。");

// ファイルシステムの変更を監視
fs.watch(templatesDir, { recursive: true }, (eventType, filename) => {
  const now = Date.now();

  // デバウンス処理 - 短時間に複数の変更イベントが発生した場合に一度だけ実行
  if (now - lastRunTime > debounceTime) {
    lastRunTime = now;

    console.log(`変更を検出しました: ${filename}`);
    console.log("next-json-server generate json コマンドを実行します...");

    // next-json-server generate json コマンドを実行
    const generateProcess = spawn(
      "bunx",
      ["next-json-server", "generate", "json"],
      {
        stdio: "inherit",
        shell: true,
      },
    );

    generateProcess.on("close", (code) => {
      if (code === 0) {
        console.log("generate コマンドが正常に完了しました。");
      } else {
        console.error(`generate コマンドが終了コード ${code} で終了しました。`);
      }
      console.log("変更の監視を続けています...");
    });
  }
});

// プロセス終了時のクリーンアップ
process.on("SIGINT", () => {
  console.log("\n監視を終了します。");
  process.exit(0);
});

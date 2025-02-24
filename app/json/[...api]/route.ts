import fs from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { isNotEmpty } from "ramda";

const basePath = "/json";

export function GET(req: NextRequest) {
  // db.jsonのパスを取得
  const dbPath = path.join(process.cwd(), "db.json");
  // db.jsonの内容を読み込む
  const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  // /json/pathを取得
  const requestPath = new URL(req.url).pathname.replace(basePath, "");
  // パスを分割
  const pathArray = requestPath.split("/").filter(isNotEmpty);
  // pathArrayの要素を検証
  // 文字列であれば、パスを辿る、数値であれば、idを検索する関数
  type ObjectHasId = { id: string };
  const jsonBody = pathArray.reduce((acc, curr) => {
    const emptyArray: unknown[] = [];
    const isNumber = !Number.isNaN(Number(curr));
    if (isNumber)
      return acc.find((item: ObjectHasId) => item.id === curr) ?? emptyArray;
    return acc[curr] ?? emptyArray;
  }, data);
  // クエリがあるかチェック
  const searchParams = req.nextUrl.searchParams;
  // JSONレスポンスを返す
  return NextResponse.json(jsonBody, { status: 200 });
}

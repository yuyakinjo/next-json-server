import fs from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { isNotEmpty } from "ramda";
import { isZero } from "./internal";

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
  type ObjectHasId = { id: string };
  const jsonBody = pathArray.reduce((acc, curr) => {
    const emptyArray: unknown[] = [];
    const isNumber = !Number.isNaN(Number(curr));
    // 数値であれば、idを検索
    if (isNumber)
      return acc.find((item: ObjectHasId) => item.id === curr) ?? emptyArray;
    // 文字列であれば、パスを辿る
    return acc[curr] ?? emptyArray;
  }, data);
  // クエリがあるかチェック
  const searchParams = req.nextUrl.searchParams;
  // クエリがなければ、jsonBodyを返す
  if (isZero(searchParams.size))
    return NextResponse.json(jsonBody, { status: 200 });
  // クエリがある場合、フィルタリングを行う
  const filteredData = Object.entries(jsonBody)
    .filter(([key, value]) => {
      const val = value as Record<string, string | number>; // 型を明示的に指定
      return Array.from(searchParams.entries()).every(
        ([paramKey, paramValue]) => {
          if (paramKey.startsWith("gt_")) {
            const field = paramKey.replace("gt_", "");
            return (
              typeof val[field] === "number" && val[field] > Number(paramValue)
            );
          }
          if (paramKey.startsWith("lt_")) {
            const field = paramKey.replace("lt_", "");
            return (
              typeof val[field] === "number" && val[field] < Number(paramValue)
            );
          }
          if (paramKey.startsWith("gte_")) {
            const field = paramKey.replace("gte_", "");
            return (
              typeof val[field] === "number" && val[field] >= Number(paramValue)
            );
          }
          if (paramKey.startsWith("lte_")) {
            const field = paramKey.replace("lte_", "");
            return (
              typeof val[field] === "number" && val[field] <= Number(paramValue)
            );
          }
          if (paramKey.startsWith("ne_")) {
            const field = paramKey.replace("ne_", "");
            return (
              typeof val[field] === "number" &&
              val[field] !== Number(paramValue)
            );
          }
          if (paramKey.startsWith("in_")) {
            const field = paramKey.replace("in_", "");
            return (
              typeof val[field] === "number" &&
              paramValue
                .split(",")
                .map(Number)
                .includes(val[field] as number)
            );
          }
          // 重複したクエリパラメータを配列として取得し、includesを使用してフィルタリング
          const allValues = searchParams.getAll(paramKey);
          return allValues.includes(String(val[paramKey]));
        },
      );
    })
    .map(([key, value]) => value); // フィルタリングされたデータを配列として返す

  // フィルタリングされたデータを返す
  return NextResponse.json(filteredData, { status: 200 });
}

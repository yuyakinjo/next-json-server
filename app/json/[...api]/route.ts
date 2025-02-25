import fs from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { isNotEmpty } from "ramda";
import { getFieldIfPrefixMatches, isNumber, isZero } from "./internal";

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
          // 各プレフィックスに対するフィールド名を取得
          const gtField = getFieldIfPrefixMatches(paramKey, "gt");
          const ltField = getFieldIfPrefixMatches(paramKey, "lt");
          const gteField = getFieldIfPrefixMatches(paramKey, "gte");
          const lteField = getFieldIfPrefixMatches(paramKey, "lte");
          const neField = getFieldIfPrefixMatches(paramKey, "ne");
          const inField = getFieldIfPrefixMatches(paramKey, "in");

          if (gtField && isNumber(val[gtField])) {
            return Number(val[gtField]) > Number(paramValue);
          }
          if (ltField && isNumber(val[ltField])) {
            return Number(val[ltField]) < Number(paramValue);
          }
          if (gteField && isNumber(val[gteField])) {
            return Number(val[gteField]) >= Number(paramValue);
          }
          if (lteField && isNumber(val[lteField])) {
            return Number(val[lteField]) <= Number(paramValue);
          }
          if (neField && isNumber(val[neField])) {
            return Number(val[neField]) !== Number(paramValue);
          }
          if (inField && isNumber(val[inField])) {
            return paramValue.split(",").includes(`${val[inField]}`);
          }
          // 重複したクエリパラメータを配列として取得し、includesを使用してフィルタリング
          // ?id=1&id=2 のようなクエリパラメータをフィルタリングする
          const allValues = searchParams.getAll(paramKey);
          return allValues.includes(`${val[paramKey]}`);
        },
      );
    })
    .map(([key, value]) => value); // フィルタリングされたデータを配列として返す

  // フィルタリングされたデータを返す
  return NextResponse.json(filteredData, { status: 200 });
}

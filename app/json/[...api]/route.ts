import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { isNotEmpty } from "ramda";
import { filterDataBySearchParams, isZero } from "./internal";

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
  const filteredData = filterDataBySearchParams(jsonBody, searchParams);

  // フィルタリングされたデータを返す
  return NextResponse.json(filteredData, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await req.json();

    // db.jsonのパスを取得
    const dbPath = path.join(process.cwd(), "db.json");

    // db.jsonの内容を読み込む
    const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    // /json/pathを取得
    const requestPath = new URL(req.url).pathname.replace(basePath, "");

    // パスを分割
    const pathArray = requestPath.split("/").filter(isNotEmpty);

    // リソース名を取得（例：posts）
    const resourceName = pathArray[0];

    if (!resourceName || !data[resourceName]) {
      return NextResponse.json(
        { error: "リソースが見つかりません" },
        { status: 404 },
      );
    }

    // 新しいアイテムにIDを付与
    const newItem = {
      id: randomUUID(),
      ...body,
    };

    // データに新しいアイテムを追加
    data[resourceName].push(newItem);

    // db.jsonに書き込む
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

    // 作成されたアイテムを返す
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("POSTリクエストエラー:", error);
    return NextResponse.json(
      { error: "リクエスト処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}

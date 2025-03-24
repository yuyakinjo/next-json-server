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

/**
 * POSTリクエストを処理する関数
 * 新しいリソースをdb.jsonに追加します
 * @param req - Next.jsのリクエストオブジェクト
 * @returns 作成されたリソースを含むレスポンス
 */
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

    // リソースが存在しない場合は404エラーを返す
    if (!resourceName || !data[resourceName]) {
      return NextResponse.json(
        { error: "リソースが見つかりません" },
        { status: 404 },
      );
    }

    // UUIDを生成
    const uuid = randomUUID();

    // 既存のリソースの配列を取得
    const existingItems = data[resourceName];

    // 既存のIDから最大値を取得
    const maxId = existingItems.reduce((max: number, item: { id: string }) => {
      // idが数値に変換可能な場合のみ比較対象とする
      const itemId = Number(item.id);
      return !Number.isNaN(itemId) && itemId > max ? itemId : max;
    }, 0);

    // 最大ID+1を新しいIDとして使用
    const newId = String(maxId + 1);

    // 新しいアイテムを作成
    const newItem = {
      ...body,
      id: newId,
      uuid,
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

/**
 * PUTリクエストを処理する関数
 * 既存のリソースをdb.jsonで更新します
 * @param req - Next.jsのリクエストオブジェクト
 * @returns 更新されたリソースを含むレスポンス
 */
export async function PUT(req: NextRequest) {
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

    // リソース名とIDを取得（例：posts, 1）
    const resourceName = pathArray[0];
    const itemId = pathArray[1];

    // リソースまたはIDが存在しない場合は404エラーを返す
    if (!resourceName || !data[resourceName]) {
      return NextResponse.json(
        { error: "リソースが見つかりません" },
        { status: 404 },
      );
    }

    // 更新対象のインデックスを検索
    const itemIndex = data[resourceName].findIndex(
      (item: { id: string }) => item.id === itemId,
    );

    // アイテムが見つからない場合は404エラーを返す
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "アイテムが見つかりません" },
        { status: 404 },
      );
    }

    // 更新されたアイテムを作成（IDは保持）
    const updatedItem = {
      ...body,
      id: itemId,
    };

    // データを更新
    data[resourceName][itemIndex] = updatedItem;

    // db.jsonに書き込む
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

    // 更新されたアイテムを返す
    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error("PUTリクエストエラー:", error);
    return NextResponse.json(
      { error: "リクエスト処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}

/**
 * DELETEリクエストを処理する関数
 * 既存のリソースをdb.jsonから削除します
 * @param req - Next.jsのリクエストオブジェクト
 * @returns 空のレスポンス（204 No Content）
 */
export async function DELETE(req: NextRequest) {
  try {
    // db.jsonのパスを取得
    const dbPath = path.join(process.cwd(), "db.json");
    // db.jsonの内容を読み込む
    const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    // /json/pathを取得
    const requestPath = new URL(req.url).pathname.replace(basePath, "");
    // パスを分割
    const pathArray = requestPath.split("/").filter(isNotEmpty);

    // リソース名とIDを取得（例：posts, 1）
    const resourceName = pathArray[0];
    const itemId = pathArray[1];

    // リソースまたはIDが存在しない場合は404エラーを返す
    if (!resourceName || !data[resourceName]) {
      return NextResponse.json(
        { error: "リソースが見つかりません" },
        { status: 404 },
      );
    }

    // 削除対象のインデックスを検索
    const itemIndex = data[resourceName].findIndex(
      (item: { id: string }) => item.id === itemId,
    );

    // アイテムが見つからない場合は404エラーを返す
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "アイテムが見つかりません" },
        { status: 404 },
      );
    }

    // データから削除
    data[resourceName].splice(itemIndex, 1);

    // db.jsonに書き込む
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

    // 204 No Contentを返す（削除成功）
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETEリクエストエラー:", error);
    return NextResponse.json(
      { error: "リクエスト処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}

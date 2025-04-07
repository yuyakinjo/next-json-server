import { type NextRequest, NextResponse } from "next/server";
import { isNotEmpty } from "ramda";
import {
  createRecord,
  deleteRecord,
  filterRecordsBySearchParams,
  getAllRecords,
  getRecordById,
  updateRecord,
} from "./internal";

const basePath = "/db/pg";

export async function GET(req: NextRequest) {
  try {
    // /db/pg/pathを取得
    const requestPath = new URL(req.url).pathname.replace(basePath, "");
    // パスを分割
    const pathArray = requestPath.split("/").filter(isNotEmpty);
    // テーブル名とIDを取得
    const tableName = pathArray[0];
    const id = pathArray[1];

    // テーブル名がない場合は400エラーを返す
    if (!tableName) {
      return NextResponse.json(
        { error: "テーブル名を指定してください" },
        { status: 400 },
      );
    }

    // クエリパラメータの取得
    const searchParams = req.nextUrl.searchParams;

    // IDが指定されている場合は特定のレコードを取得
    if (id) {
      const record = await getRecordById(tableName, id);
      if (!record) {
        return NextResponse.json(
          { error: "レコードが見つかりません" },
          { status: 404 },
        );
      }
      return NextResponse.json(record, { status: 200 });
    }

    // クエリパラメータがある場合はフィルタリング
    if (searchParams.size > 0) {
      const filteredRecords = await filterRecordsBySearchParams(
        tableName,
        searchParams,
      );
      return NextResponse.json(filteredRecords, { status: 200 });
    }

    // すべてのレコードを取得
    const allRecords = await getAllRecords(tableName);
    return NextResponse.json(allRecords, { status: 200 });
  } catch (error) {
    console.error("PostgreSQL GETリクエストエラー:", error);
    return NextResponse.json(
      { error: "データベース処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await req.json();
    // /db/pg/pathを取得
    const requestPath = new URL(req.url).pathname.replace(basePath, "");
    // パスを分割
    const pathArray = requestPath.split("/").filter(isNotEmpty);
    // テーブル名を取得
    const tableName = pathArray[0];

    // テーブル名がない場合は400エラーを返す
    if (!tableName) {
      return NextResponse.json(
        { error: "テーブル名を指定してください" },
        { status: 400 },
      );
    }

    // レコードを作成
    const newRecord = await createRecord(tableName, body);

    // 作成されたレコードを返す
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error("PostgreSQL POSTリクエストエラー:", error);
    return NextResponse.json(
      { error: "データベース処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await req.json();
    // /db/pg/pathを取得
    const requestPath = new URL(req.url).pathname.replace(basePath, "");
    // パスを分割
    const pathArray = requestPath.split("/").filter(isNotEmpty);
    // テーブル名とIDを取得
    const tableName = pathArray[0];
    const id = pathArray[1];

    // テーブル名またはIDがない場合は400エラーを返す
    if (!tableName || !id) {
      return NextResponse.json(
        { error: "テーブル名とIDを指定してください" },
        { status: 400 },
      );
    }

    // レコードが存在するか確認
    const existingRecord = await getRecordById(tableName, id);
    if (!existingRecord) {
      return NextResponse.json(
        { error: "更新対象のレコードが見つかりません" },
        { status: 404 },
      );
    }

    // レコードを更新
    const updatedRecord = await updateRecord(tableName, id, body);

    // 更新されたレコードを返す
    return NextResponse.json(updatedRecord, { status: 200 });
  } catch (error) {
    console.error("PostgreSQL PUTリクエストエラー:", error);
    return NextResponse.json(
      { error: "データベース処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // /db/pg/pathを取得
    const requestPath = new URL(req.url).pathname.replace(basePath, "");
    // パスを分割
    const pathArray = requestPath.split("/").filter(isNotEmpty);
    // テーブル名とIDを取得
    const tableName = pathArray[0];
    const id = pathArray[1];

    // テーブル名またはIDがない場合は400エラーを返す
    if (!tableName || !id) {
      return NextResponse.json(
        { error: "テーブル名とIDを指定してください" },
        { status: 400 },
      );
    }

    // レコードが存在するか確認
    const existingRecord = await getRecordById(tableName, id);
    if (!existingRecord) {
      return NextResponse.json(
        { error: "削除対象のレコードが見つかりません" },
        { status: 404 },
      );
    }

    // レコードを削除
    await deleteRecord(tableName, id);

    // 204 No Contentを返す（削除成功）
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("PostgreSQL DELETEリクエストエラー:", error);
    return NextResponse.json(
      { error: "データベース処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}

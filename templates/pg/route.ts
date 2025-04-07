import { randomUUID } from "node:crypto";
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

    // テーブル名がない場合は空の配列を返す（JSON APIと同様の動作）
    if (pathArray.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // テーブル名を取得
    const [tableName] = pathArray;

    // クエリパラメータの取得
    const searchParams = req.nextUrl.searchParams;

    // 複数の階層を持つパスの処理（/posts/1/comments など）
    if (pathArray.length > 1) {
      const [id] = pathArray;

      // IDで特定のレコードを取得
      const record = await getRecordById(tableName, id);

      // レコードが見つからない場合は空の配列を返す（JSON APIと同様の動作）
      if (!record) {
        return NextResponse.json([], { status: 200 });
      }

      // ネストされたリソースが指定されている場合（例: /posts/1/comments）
      if (pathArray.length > 2) {
        const nestedResource = pathArray[2];
        // ネストされたリソースがIDも指定されている場合（例: /posts/1/comments/1）
        if (pathArray.length > 3) {
          const nestedId = pathArray[3];
          try {
            // ネストされたリソースのIDで取得
            const nestedRecord = await getRecordById(nestedResource, nestedId);
            // 条件に一致するレコードがあればそれを返し、なければ空の配列を返す
            if (nestedRecord) {
              return NextResponse.json([nestedRecord], { status: 200 });
            }
            return NextResponse.json([], { status: 200 });
          } catch (error) {
            // エラーが発生した場合も空の配列を返す
            return NextResponse.json([], { status: 200 });
          }
        }

        // ネストされたリソースのみ指定されている場合（例: /posts/1/comments）
        try {
          // クエリパラメータに主リソースのIDを追加してフィルタリング
          const nestedSearchParams = new URLSearchParams(searchParams);
          nestedSearchParams.append(`${tableName}Id`, id);

          // ネストされたリソースを取得
          const nestedRecords = await filterRecordsBySearchParams(
            nestedResource,
            nestedSearchParams,
          );
          return NextResponse.json(nestedRecords, { status: 200 });
        } catch (error) {
          // エラーが発生した場合も空の配列を返す
          return NextResponse.json([], { status: 200 });
        }
      }

      // ネストされたリソースがない場合は単一のレコードを返す
      return NextResponse.json(record, { status: 200 });
    }

    // テーブルが存在しない場合でも空の配列を返す（JSON APIと同様の動作）
    try {
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
      // テーブルが存在しないなどのエラーが発生した場合は空の配列を返す
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("PostgreSQL GETリクエストエラー:", error);
    // エラーの場合でも空の配列を返す（JSON APIと同様の動作）
    return NextResponse.json([], { status: 200 });
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
    const [tableName] = pathArray;

    // テーブル名がない場合は400エラーを返す
    if (!tableName) {
      return NextResponse.json(
        { error: "テーブル名を指定してください" },
        { status: 400 },
      );
    }

    // UUIDを生成 (JSON APIと同様の動作)
    const uuid = randomUUID();
    const dataWithUuid = {
      ...body,
      uuid,
    };

    // レコードを作成
    const newRecord = await createRecord(tableName, dataWithUuid);

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
    const [tableName, id] = pathArray;

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
    const [tableName, id] = pathArray;

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

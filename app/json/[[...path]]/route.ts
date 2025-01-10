import { DB_JSON_PATH } from "@/app/json/[[...path]]/constants";
import { getJsonData, toJsonString } from "@/app/json/[[...path]]/internal";
import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { assocPath, findIndex, path, propEq, update } from "ramda";

// GET /json/[path]
// GET /json/[path]/[id]
export async function GET(req: NextRequest) {
  const { isDetailPath, listData, detailData, isRootPath, dbJson } =
    await getJsonData(req);
  if (isRootPath) return NextResponse.json(dbJson);

  const result = isDetailPath ? detailData : listData;
  return NextResponse.json(result);
}

// POST /json/[path]
// array: add new item
// object: replace object
export async function POST(req: NextRequest) {
  const { relativePaths, dynamicData, dbJson, reqBody } =
    await getJsonData(req);
  const newItem = { id: randomUUID(), ...reqBody };
  const updateData = [...[dynamicData].flat(), newItem];
  const updatedJson = assocPath(relativePaths, updateData, dbJson);
  writeFileSync(DB_JSON_PATH, toJsonString(updatedJson));
  return NextResponse.json(newItem, { status: 201 });
}

// PUT /json/[path]/[id]
// array: replace array only if item exists
// object: replace object
export async function PUT(req: NextRequest) {
  const {
    dbJson,
    reqBody,
    middlePaths,
    baseName,
    detailData,
    dynamicData,
    listData,
  } = await getJsonData(req);
  const data = [listData].flat();
  if (!dynamicData) {
    return NextResponse.json({ message: "There is no data" }, { status: 404 });
  }
  const whereEqId = propEq(baseName, "id");
  const index = findIndex(whereEqId, path(middlePaths, dbJson) ?? []);
  if (index === -1) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  const updatedData = { ...detailData, ...reqBody };
  const updatedJson = assocPath(
    middlePaths,
    update(index, updatedData, data),
    dbJson,
  );
  console.log({ updatedData, updatedJson, index });
  writeFileSync(DB_JSON_PATH, toJsonString(updatedJson));
  return NextResponse.json(reqBody);
}

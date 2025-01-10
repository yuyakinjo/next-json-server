import { getJsonData, jsonFile } from "@/app/json/[[...path]]/internal";
import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  assocPath,
  complement,
  filter,
  findIndex,
  omit,
  path,
  pathEq,
  propEq,
  update,
} from "ramda";

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
export async function POST(req: NextRequest) {
  const { relativePaths, dynamicData, dbJson, reqBody } =
    await getJsonData(req);
  const newItem = { ...reqBody, id: randomUUID() };
  const updateData = [...[dynamicData].flat(), newItem];
  const updatedJson = assocPath(relativePaths, updateData, dbJson);
  await jsonFile.write(updatedJson);
  return NextResponse.json(newItem, { status: 201 });
}

// PUT /json/[path]/[id]
// array: replace array only if item exists
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
  const id = baseName;
  const whereEqId = propEq(id, "id");
  const index = findIndex(whereEqId, path(middlePaths, dbJson) ?? []);
  if (index === -1) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  const updatedData = { ...detailData, ...omit(["id"], reqBody) };
  const updatedJson = assocPath(
    middlePaths,
    update(index, updatedData, data),
    dbJson,
  );
  await jsonFile.write(updatedJson);
  return NextResponse.json(reqBody);
}

// DELETE /json/[path]/[id]
// array: remove item
export async function DELETE(req: NextRequest) {
  const { dbJson, middlePaths, baseName, detailData, dynamicData, listData } =
    await getJsonData(req);
  const data = [listData].flat();
  if (!dynamicData) {
    return NextResponse.json({ message: "There is no data" }, { status: 404 });
  }
  const id = baseName;
  const whereEqId = propEq(baseName, "id");
  const index = findIndex(whereEqId, path(middlePaths, dbJson) ?? []);
  if (index === -1) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  const updatedJson = assocPath(
    middlePaths,
    filter(complement(pathEq(id, ["id"])), data),
    dbJson,
  );
  await jsonFile.write(updatedJson);
  return NextResponse.json(detailData, { status: 204 });
}

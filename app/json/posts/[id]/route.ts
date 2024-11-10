import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { DB_JSON_PATH } from "@/scripts/constants";
import { generateRelationMap } from "@/scripts/generate-relation-map";
import { type NextRequest, NextResponse } from "next/server";

export interface Posts {
  id: string;
  title: string;
  views: number;
}

const dbPath = DB_JSON_PATH;
const dbData = JSON.parse(readFileSync(dbPath, "utf-8"));
const relationMap = generateRelationMap(dbData);

const applyInnerJoin = <T extends { id: string }>(
  item: T,
  dbData: Record<string, { [key: string]: unknown }[]>,
  resource: string,
): T => {
  const relations = relationMap[resource] || {};
  const joined = Object.entries(relations).reduce(
    (acc, [relatedResource, relationKey]) => {
      const children = dbData[relatedResource].filter(
        (relatedItem: { [key: string]: unknown }) =>
          relatedItem[relationKey as string] === item.id,
      );
      return Object.assign(acc, { [relatedResource]: children });
    },
    item,
  );
  return joined;
};

export async function GET(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const id = basename(pathname);
  const resource = "posts";
  const item = dbData[resource].find((item: Posts) => item.id === id);
  if (!item) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  const joinedItem = applyInnerJoin(item, dbData, resource);
  return NextResponse.json(joinedItem);
}

export async function PUT(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const id = basename(pathname);
  console.log("🚀 ~ PUT ~ id:", id);
  const resource = "posts";
  const updatedItem: Posts = await req.json();

  if (updatedItem.id !== id) {
    return NextResponse.json({ message: "ID mismatch" }, { status: 400 });
  }

  const index = dbData[resource].findIndex((item: Posts) => item.id === id);
  if (index === -1)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  dbData[resource][index] = updatedItem;
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(dbData[resource][index]);
}

export async function PATCH(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const id = basename(pathname);
  const resource = "posts";
  const updatedFields: Partial<Posts> = await req.json();
  const index = dbData[resource].findIndex((item: Posts) => item.id === id);

  if (index === -1)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  dbData[resource][index] = { ...dbData[resource][index], ...updatedFields };
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(dbData[resource][index]);
}

export async function DELETE(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const id = basename(pathname);
  const resource = "posts";
  dbData[resource] = dbData[resource].filter((item: Posts) => item.id !== id);
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return new NextResponse(null, { status: 204 });
}
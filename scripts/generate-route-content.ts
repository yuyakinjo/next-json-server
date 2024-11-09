export const generateRouteContentArray = (
  key: string,
  interfaceContent: string,
) => {
  const typeName = key.charAt(0).toUpperCase() + key.slice(1);
  return `
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type DBJson from "@/db.json";
import { type NextRequest, NextResponse } from "next/server";
import { generateRelationMap } from "@/scripts/generate-relation-map";
import { DB_JSON_PATH } from "@/scripts/constants";

${interfaceContent}

const dbPath = DB_JSON_PATH;
const dbData = JSON.parse(readFileSync(dbPath, 'utf-8'));
const relationMap = generateRelationMap(dbData);

const operators = {
  lt: (a: number, b: number) => a < b,
  lte: (a: number, b: number) => a <= b,
  gt: (a: number, b: number) => a > b,
  gte: (a: number, b: number) => a >= b,
  ne: (a: number, b: number) => a !== b,
  eq: (a: number, b: number) => a === b,
};

const applyFilters = <T extends { id: string }>(
  data: T[],
  searchParams: URLSearchParams,
): T[] => {
  return data.filter((item) => {
    for (const [key, value] of searchParams.entries()) {
      const [field, operator] = key.split("_");
      const itemValue = item[field as keyof T];
      if (!(operator in operators)) return true;
      return operators[operator as keyof typeof operators](
        Number(itemValue),
        Number(value),
      );
    }
    return true;
  });
};

const applySort = <T>(data: T[], sortParams: string | null): T[] => {
  if (!sortParams) return data;
  const sortFields = sortParams.split(",");
  return data.sort((a, b) => {
    for (const field of sortFields) {
      const direction = field.startsWith("-") ? -1 : 1;
      const fieldName = field.startsWith("-") ? field.slice(1) : field;
      if (a[fieldName as keyof T] < b[fieldName as keyof T]) return -1 * direction;
      if (a[fieldName as keyof T] > b[fieldName as keyof T]) return 1 * direction;
    }
    return 0;
  });
};

const applyInnerJoin = <T extends { id: string }>(
  data: T[],
  dbData: Record<string, { [key: string]: unknown }[]>,
  resource: string,
): T[] => {
  const relations = relationMap[resource] || {};
  return data.map((item) => {
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
  });
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '10');
  const sort = searchParams.get('sort');
  const resource = '${key}';
  const data = dbData[resource];
  const filtered = applyFilters(data, searchParams);
  const joined = applyInnerJoin(filtered, dbData, resource);
  const sorted = applySort(joined, sort);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = sorted.slice(start, end);
  return NextResponse.json(paginatedData, { headers: { 'X-Total-Count': filtered.length.toString() } });
}

export async function POST(req: NextRequest) {
  const resource = '${key}';
  const reqBody: ${typeName} = await req.json();
  const newItem = { ...reqBody, id: randomUUID() };
  dbData[resource].push(newItem);
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(newItem, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const resource = '${key}';
  const updatedItem: ${typeName} = await req.json();
  const index = dbData[resource].findIndex((item: ${typeName}) => item.id === id);

  if (index === -1)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  dbData[resource][index] = updatedItem;
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(dbData[resource][index]);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const resource = '${key}';
  dbData[resource] = dbData[resource].filter((item: ${typeName}) => item.id !== id);
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(null, { status: 204 });
}
`.trimStart();
};

export const generateRouteContentNonArray = (
  key: string,
  interfaceContent: string,
) => {
  const typeName = key.charAt(0).toUpperCase() + key.slice(1);
  return `
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type NextRequest, NextResponse } from "next/server";
import { DB_JSON_PATH } from "@/scripts/constants";

${interfaceContent}

const dbPath = DB_JSON_PATH;
const dbData = JSON.parse(readFileSync(dbPath, 'utf-8'));

export async function GET(req: NextRequest) {
  const resource = '${key}';
  const data = dbData[resource];
  return NextResponse.json(data, { headers: { 'X-Total-Count': data ? '1' : '0' } });
}

export async function PUT(req: NextRequest) {
  const resource = '${key}';
  const updatedItem: ${typeName} = await req.json();
  dbData[resource] = updatedItem;
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(updatedItem);
}

export async function PATCH(req: NextRequest) {
  const resource = '${key}';
  const updatedFields: Partial<${typeName}> = await req.json();
  dbData[resource] = { ...dbData[resource], ...updatedFields };
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(dbData[resource]);
}
`.trimStart();
};

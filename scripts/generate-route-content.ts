export const generateRouteContentArray = (
  key: string,
  interfaceContent: string,
) => {
  const typeName = key.charAt(0).toUpperCase() + key.slice(1);
  return `
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

${interfaceContent}

const dbPath = join(process.cwd(), 'db.json');
const dbData = JSON.parse(readFileSync(dbPath, 'utf-8'));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '10');
  const resource = '${key}';
  const data = dbData[resource];
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = data.slice(start, end);
  return NextResponse.json(paginatedData, { headers: { 'X-Total-Count': data.length.toString() } });
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

${interfaceContent}

const dbPath = join(process.cwd(), 'db.json');
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

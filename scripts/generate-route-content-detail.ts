export const generateRouteContentDetail = (
  key: string,
  interfaceContent: string,
) => {
  const typeName = key.charAt(0).toUpperCase() + key.slice(1);
  return `
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";

${interfaceContent}

const dbPath = join(process.cwd(), 'db.json');
const dbData = JSON.parse(readFileSync(dbPath, 'utf-8'));

export async function GET(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const id = basename(pathname);
  const resource = '${key}';
  const item = dbData[resource].find((item: ${typeName}) => item.id === id);
  if (!item) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const id = basename(pathname);
  const resource = '${key}';
  const updatedItem: ${typeName} = await req.json();
  const index = dbData[resource].findIndex((item: ${typeName}) => item.id === id);

  if (index === -1)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  dbData[resource][index] = updatedItem;
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(dbData[resource][index]);
}

export async function PATCH(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const id = basename(pathname);
  const resource = '${key}';
  const updatedFields: Partial<${typeName}> = await req.json();
  const index = dbData[resource].findIndex((item: ${typeName}) => item.id === id);

  if (index === -1)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  dbData[resource][index] = { ...dbData[resource][index], ...updatedFields };
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(dbData[resource][index]);
}

export async function DELETE(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const id = basename(pathname);
  const resource = '${key}';
  dbData[resource] = dbData[resource].filter((item: ${typeName}) => item.id !== id);
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return new NextResponse(null, { status: 204 });
}
`.trimStart();
};

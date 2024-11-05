import { readFileSync } from "node:fs";

export const generateRouteContent = (
  key: string,
  interfaceContent: string,
  dataIsArray: boolean,
) => {
  let routeContent = `
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

${interfaceContent}

const dbPath = join(process.cwd(), 'db.json');
const dbData = JSON.parse(readFileSync(dbPath, 'utf-8'));

export async function GET(req: NextRequest) {
  const resource = '${key}';
  return NextResponse.json(dbData[resource]);
}
`;

  if (dataIsArray) {
    routeContent += `
export async function POST(req: NextRequest) {
  const resource = '${key}';
  const newItem: ${key.charAt(0).toUpperCase() + key.slice(1)} = await req.json();
  const index = dbData[resource].findIndex((item: ${key.charAt(0).toUpperCase() + key.slice(1)}) => item.id === newItem.id);

  if (index !== -1) {
    dbData[resource][index] = { ...dbData[resource][index], ...newItem };
  } else {
    if (!newItem.id) {
      newItem.id = randomUUID();
    }
    dbData[resource].push(newItem);
  }

  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(newItem, { status: index !== -1 ? 200 : 201 });
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const resource = '${key}';
  const updatedItem: ${key.charAt(0).toUpperCase() + key.slice(1)} = await req.json();
  const index = dbData[resource].findIndex((item: ${key.charAt(0).toUpperCase() + key.slice(1)}) => item.id === id);

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
  dbData[resource] = dbData[resource].filter((item: ${key.charAt(0).toUpperCase() + key.slice(1)}) => item.id !== id);
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(null, { status: 204 });
}
`;
  }

  return routeContent.trimStart();
};

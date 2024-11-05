import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Path to the db.json file
const dbPath = join(__dirname, "../db.json");
// Path to the app folder
const appFolderPath = join(__dirname, "../app/json");

// Read and parse db.json
const dbData = JSON.parse(readFileSync(dbPath, "utf-8"));

// Ensure the app folder exists
if (!existsSync(appFolderPath)) {
  mkdirSync(appFolderPath);
}

// Generate TypeScript interfaces
const generateInterface = (key: string, example: Record<string, string>) => {
  const fields = Object.keys(example)
    .map((field) => {
      const type = typeof example[field];
      return `  ${field}: ${type};`;
    })
    .join("\n");
  return `export interface ${key.charAt(0).toUpperCase() + key.slice(1)} {\n${fields}\n}`;
};

// Create folders and route.ts files based on the first-level keys of db.json
for (const key of Object.keys(dbData)) {
  const folderPath = join(appFolderPath, key);
  if (!existsSync(folderPath)) {
    mkdirSync(folderPath);
  }

  const routeFilePath = join(folderPath, "route.ts");
  if (!existsSync(routeFilePath)) {
    const exampleItem = Array.isArray(dbData[key])
      ? dbData[key][0]
      : dbData[key];
    const interfaceContent = generateInterface(key, exampleItem);

    const routeContent = `
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type NextRequest, NextResponse } from "next/server";

${interfaceContent}

const dbPath = join(process.cwd(), 'db.json');
const dbData = JSON.parse(readFileSync(dbPath, 'utf-8'));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const resource = '${key}';

  if (!id) return NextResponse.json(dbData[resource]);

  const item = dbData[resource].find((item: ${key.charAt(0).toUpperCase() + key.slice(1)}) => item.id === id);
  return NextResponse.json(item);
}

export async function POST(req: NextRequest) {
  const resource = '${key}';
  const newItem: ${key.charAt(0).toUpperCase() + key.slice(1)} = await req.json();
  dbData[resource].push(newItem);
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(newItem, { status: 201 });
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
    writeFileSync(routeFilePath, routeContent.trim());
  }
}

console.log("Folders and route.ts files created successfully.");

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { generateInterface } from "./generate-interface";

// Path to the db.json file
const dbPath = join(__dirname, "../db.json");
// Path to the app folder
const appFolderPath = join(__dirname, "../app/json");

// Delete the app folder if it exists
if (existsSync(appFolderPath)) {
  rmSync(appFolderPath, { recursive: true, force: true });
}

// Ensure the app folder exists
mkdirSync(appFolderPath);

// Read and parse db.json
const dbData = JSON.parse(readFileSync(dbPath, "utf-8"));

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

    if (Array.isArray(dbData[key])) {
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

    writeFileSync(routeFilePath, routeContent.trimStart());
  }
}

console.log("Folders and route.ts files created successfully.");

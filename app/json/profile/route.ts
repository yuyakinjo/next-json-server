import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { DB_JSON_PATH } from "@/scripts/constants";

export interface Profile {
  name: string;
}

const dbPath = DB_JSON_PATH;
const dbData = JSON.parse(readFileSync(dbPath, "utf-8"));

export async function GET(req: NextRequest) {
  const resource = "profile";
  const data = dbData[resource];
  return NextResponse.json(data, { headers: { "X-Total-Count": data ? "1" : "0" } });
}

export async function PUT(req: NextRequest) {
  const resource = "profile";
  const updatedItem: Profile = await req.json();
  dbData[resource] = updatedItem;
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(updatedItem);
}

export async function PATCH(req: NextRequest) {
  const resource = "profile";
  const updatedFields: Partial<Profile> = await req.json();
  dbData[resource] = { ...dbData[resource], ...updatedFields };
  writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  return NextResponse.json(dbData[resource]);
}

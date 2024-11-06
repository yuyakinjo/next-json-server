import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  generateRouteContentArray,
  generateRouteContentNonArray,
} from "@/scripts/generate-route-content";
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
    const itemIsArray = Array.isArray(dbData[key]);
    const exampleItem = itemIsArray ? dbData[key][0] : dbData[key];
    const interfaceContent = generateInterface(key, exampleItem);
    const routeContent = itemIsArray
      ? generateRouteContentArray(key, interfaceContent)
      : generateRouteContentNonArray(key, interfaceContent);

    writeFileSync(routeFilePath, routeContent);
  }
}

console.log("Folders and route.ts files created successfully.");

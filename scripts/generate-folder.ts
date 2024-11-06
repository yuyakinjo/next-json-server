import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { generateInterface } from "@/scripts/generate-interface";
import {
  generateRouteContentArray,
  generateRouteContentNonArray,
} from "@/scripts/generate-route-content";
import { generateRouteContentDetail } from "@/scripts/generate-route-content-detail";

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

// Function to detect relation keys
const detectRelationKeys = (propName: string, exampleItem: object) => {
  const relationKeys = Object.keys(exampleItem)
    .filter((key) => key.endsWith("Id"))
    .map((key) => ({
      key,
      parentName: propName,
      childName: key.replace("Id", ""),
    }));
  return relationKeys;
};
export type RelationKeys = ReturnType<typeof detectRelationKeys>;

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
    const relationKeys = detectRelationKeys(key, exampleItem); // Detect relation keys. ex. postsId
    const routeContent = itemIsArray
      ? generateRouteContentArray(key, interfaceContent, relationKeys)
      : generateRouteContentNonArray(key, interfaceContent);

    writeFileSync(routeFilePath, routeContent);

    if (itemIsArray) {
      const detailFolderPath = join(folderPath, "[id]");
      if (!existsSync(detailFolderPath)) {
        mkdirSync(detailFolderPath);
      }
      const detailRouteFilePath = join(detailFolderPath, "route.ts");
      const detailRouteContent = generateRouteContentDetail(
        key,
        interfaceContent,
      );
      writeFileSync(detailRouteFilePath, detailRouteContent);
    }
  }
}

console.log("Folders and route.ts files created successfully.");

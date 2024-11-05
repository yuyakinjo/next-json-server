import { existsSync, mkdirSync, readFileSync } from "node:fs";
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

// Create folders based on the first-level keys of db.json
for (const key of Object.keys(dbData)) {
  const folderPath = join(appFolderPath, key);
  if (existsSync(folderPath)) {
    console.log(`Folder already exists: ${folderPath}`);
  } else {
    mkdirSync(folderPath);
    console.log(`Created folder: ${folderPath}`);
  }
}

console.log("Folders created successfully.");

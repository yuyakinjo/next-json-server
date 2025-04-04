#!/usr/bin/env node

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// Track the last execution time
let lastRunTime = 0;
const debounceTime = 300; // milliseconds

// Path to the directory to watch
const templatesDir = path.join(process.cwd(), "templates");

// Check if template directory exists
if (!fs.existsSync(templatesDir)) {
  console.error("Error: templates directory not found.");
  process.exit(1);
}

console.log("Started watching templates directory...");
console.log(
  "The generate command will be executed automatically when files change.",
);

// Watch for filesystem changes
fs.watch(templatesDir, { recursive: true }, (eventType, filename) => {
  const now = Date.now();

  // Debounce processing - execute only once if multiple change events occur in a short time
  if (now - lastRunTime > debounceTime) {
    lastRunTime = now;

    console.log(`Change detected: ${filename}`);
    console.log("Running next-json-server generate json command...");

    // Execute next-json-server generate json command
    const generateProcess = spawn(
      "bunx",
      ["next-json-server", "generate", "json"],
      {
        stdio: "inherit",
        shell: true,
      },
    );

    generateProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Generate command completed successfully.");
      } else {
        console.error(`Generate command exited with code ${code}.`);
      }
      console.log("Continuing to watch for changes...");
    });
  }
});

// Cleanup on process exit
process.on("SIGINT", () => {
  console.log("\nEnding watch process.");
  process.exit(0);
});

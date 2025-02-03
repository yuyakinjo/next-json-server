import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { DB_JSON_PATH } from "@/app/json/[[...path]]/constants";
import type { NextRequest } from "next/server";
import { path, defaultTo, intersection, pathEq } from "ramda";

const prefix = "json";

export const getJsonData = async (req: NextRequest) => {
  const { pathname } = new URL(req.url); // ex. /json/posts/1
  // #region relative
  const relativePath = pathname.replace(`/${prefix}`, ""); // ex. /posts/1
  const relativePaths = relativePath.split("/").filter(Boolean); // ex. /posts/1 => ["posts", "1"]
  // #region dir
  const dirName = dirname(pathname); // ex. /json/posts
  const dirPaths = dirName.split("/").filter(Boolean); // ex. /json/posts => ["json", "posts"]
  // #region base
  const baseName = basename(pathname); // ex. 1
  // #region intersection
  const middlePaths = intersection(relativePaths, dirPaths); // ex. intersection(["posts", "1"], ["json", "posts"]) => ["posts"]
  const isRootPath = `${prefix}` === `${baseName}`;
  const reqBody = await req?.json().catch(defaultTo({})); // ex. { title: "Hello" }
  const dbJson = await jsonFile.read();
  const dynamicData = path(relativePaths, dbJson) ?? {}; // db.json の dynamicPaths のデータを取得
  const listData = path(middlePaths, dbJson) ?? []; // db.json の relativePaths のデータを取得
  const isDetailPath = !Array.isArray(dynamicData); // /json/posts/1 false, /json/posts true
  const detailData = [listData].flat().find(pathEq(baseName, ["id"])) ?? {};
  const result = {
    dynamicData,
    dbJson,
    reqBody,
    dirName,
    baseName,
    dirPaths,
    isRootPath,
    isDetailPath,
    detailData,
    relativePaths,
    middlePaths,
    listData,
  };

  console.log("🚀 ~ getJsonData ~ result:", result);
  return result;
};

export const jsonFile = {
  toJsonString: (data: unknown) => JSON.stringify(data, null, 2),
  async write(updatedJson: unknown, path = DB_JSON_PATH) {
    return writeFile(path, this.toJsonString(updatedJson));
  },
  async read(path = DB_JSON_PATH) {
    return readFile(path, "utf-8").then(JSON.parse).catch(defaultTo({})); // db.jsonの内容
  },
};

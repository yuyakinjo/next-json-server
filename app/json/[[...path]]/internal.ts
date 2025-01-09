import type { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { defaultTo, hasPath, intersection, path, pathEq } from "ramda";
import { DB_JSON_PATH } from "./constants";

const prefix = "json";

/**
 * Retrieves JSON data based on the request URL and request body.
 *
 * @param {NextRequest} req - The incoming request object.
 * @returns {Promise<object>} An object containing various data derived from the request and the database JSON.
 *
 * @property {object} dynamicData - The dynamic data extracted from the database JSON based on the request path.
 * @property {object} dbJson - The entire content of the database JSON file.
 * @property {object} reqBody - The parsed JSON body of the request.
 * @property {string} dirName - The directory name derived from the request path.
 * @property {string} baseName - The base name derived from the request path.
 * @property {string[]} dirPaths - The directory paths split into an array.
 * @property {boolean} isRootPath - A flag indicating if the request path is the root path.
 * @property {boolean} isDetailPath - A flag indicating if the request path is a detail path.
 * @property {object} detailData - The detailed data extracted from the database JSON based on the request path.
 * @property {string[]} relativePaths - The relative paths split into an array.
 */
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
  const isRootPath = `/${prefix}` === `/${baseName}`;
  const reqBody = await req?.json().catch(defaultTo({})); // ex. { title: "Hello" }
  const dbJson = await readFile(DB_JSON_PATH, "utf-8")
    .then(JSON.parse)
    .catch(defaultTo({})); // db.jsonの内容
  const dynamicData = path(relativePaths, dbJson) ?? {}; // db.json の dynamicPaths のデータを取得
  const listData = path(middlePaths, dbJson) ?? []; // db.json の middlePaths のデータを取得
  const isDetailPath = !hasPath(relativePaths, dbJson); // /json/posts/1 false, /json/posts true
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
  console.log(result);

  return result;
};

export const toJsonString = (data: unknown) => JSON.stringify(data, null, 2);

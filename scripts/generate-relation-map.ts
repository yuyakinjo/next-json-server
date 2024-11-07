import type DBJson from "@/db.json";

export const generateRelationMap = (db: typeof DBJson) => {
  // relationMap Output ex: [[], [[["posts"], {comments: "postsId"}]], []]
  const relationMap = Object.keys(db).map((key) => {
    const item = db[key as keyof typeof db];
    const exampleItem = Array.isArray(item) ? item[0] : item;

    // mappings Output ex: [[], [[["posts"], {comments: "postsId"}]], []]
    const mappings = Object.keys(exampleItem)
      .filter((prop) => prop.endsWith("Id"))
      .map((prop) => [[prop.replace("Id", "")], { [key]: prop }]);

    return mappings;
  });

  // deleteEmptyArray Output ex: [[ "posts" ], {comments: "postsId",}]
  const deleteEmptyArray = relationMap.flat();

  // relationMap Output ex: { posts: { comments: "postsId" } }
  return Object.fromEntries(deleteEmptyArray);
};

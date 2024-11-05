export const generateInterface = (
  key: string,
  example: Record<string, string>,
) => {
  const fields = Object.keys(example)
    .map((field) => {
      const type = typeof example[field];
      return `  ${field}: ${type};`;
    })
    .join("\n");
  return `export interface ${key.charAt(0).toUpperCase() + key.slice(1)} {\n${fields}\n}`;
};

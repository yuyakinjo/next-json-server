export const generateClass = (
  key: string,
  example: Record<string, string | number>,
) => {
  const className = key.charAt(0).toUpperCase() + key.slice(1);
  const fields = Object.keys(example)
    .map((field) => {
      const type = typeof example[field];
      return `  ${field}: ${type};`;
    })
    .join("\n");
  const constructorParams = Object.keys(example)
    .map((field) => {
      const type = typeof example[field];
      return `    ${field}: ${type},`;
    })
    .join("\n");
  const constructorBody = Object.keys(example)
    .map((field) => `    this.${field} = ${field};`)
    .join("\n");

  return `
export class ${className} {
${fields}

  constructor(
${constructorParams}
  ) {
${constructorBody}
  }
}
`.trimStart();
};

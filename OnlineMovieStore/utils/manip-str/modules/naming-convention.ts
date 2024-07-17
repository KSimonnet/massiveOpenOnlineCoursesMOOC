/**
 * Converts a string to PascalCase.
 * for naming classes, interfaces, and types.
 * @param str - The input string to be converted.
 * @returns The converted string in PascalCase.
 * @throws {Error} If the input is not a string.
 */
function toPascalCase(str: string): string {
  if (typeof str !== "string") {
    throw new Error(
      `toPascalCase - Invalid input. Expected ${str} to be a string. Instead, was passed ${typeof str}`,
    );
  }
  if (!str) {
    return str;
  }
  return str
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\B\w/g, (letter) => letter.toLowerCase());
}
export { toPascalCase }; // Object literal property value shorthand aka shorthand property name syntax

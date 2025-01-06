/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Create a safe TemplateStringsArray from a regular string array.
 * @param parts Array of template parts.
 */
export function makeTemplateObject(parts: string[]): TemplateStringsArray {
  const cooked = [...parts];
  const raw = [...parts];
  if (Object.defineProperty) {
    Object.defineProperty(cooked, "raw", { value: raw });
  } else {
    (cooked as any).raw = raw;
  }
  return cooked as any;
}

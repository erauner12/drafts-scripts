/**
 * MyPlainJsUtils.d.ts
 *
 * If you want IntelliSense and type-checking for your plain JS code,
 * you can create a .d.ts with matching function signatures.
 *
 * By placing this in the same "utils" directory, and referencing
 * "typeRoots" or "include" in tsconfig, TypeScript can see it.
 */

export function getRandomInt(min: number, max: number): number;

/**
 * Capitalize the first letter of a string.
 */
export function capitalizeFirst(str: string): string;

/**
 * Creates an array from start up to (but not including) end.
 */
export function createRange(start: number, end: number): number[];

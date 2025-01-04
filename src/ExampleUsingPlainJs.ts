/**
 * ExampleUsingPlainJs.ts
 *
 * This file demonstrates how to import and use a plain JavaScript file
 * from "utils/MyPlainJsUtils.js" which optionally has a .d.ts for type hints.
 */

import {
  capitalizeFirst,
  createRange,
  getRandomInt,
} from "../utils/MyPlainJsUtils.js";
import { log } from "./helpers-utils";

// A sample function to demonstrate usage in Drafts or other TS code
export function runPlainJsExample() {
  // 1. Use getRandomInt
  const rand = getRandomInt(1, 10);
  log("Random int between 1..9 = " + rand);

  // 2. Use capitalizeFirst
  const phrase = "hello from plain js!";
  const capitalized = capitalizeFirst(phrase);
  log("Capitalized phrase = " + capitalized);

  // 3. Use createRange
  const myRange = createRange(5, 10);
  log("Range from 5..9 = " + myRange.join(", "));

  // Done
}

/**
 * ExampleUsingMyLegacyLib.ts
 *
 * Demonstrates usage of a legacy UMD-based library that attaches
 * itself to the global object (e.g. "MyLegacyLib").
 *
 * Usage:
 * 1. Ensure "MyLegacyLib.js" is loaded in Drafts or the environment
 *    (like `require("custom-libs/MyLegacyLib.js")`).
 * 2. Then call exampleUsingMyLegacyLib() from a script action.
 */

import { log } from "./helpers/helpers-utils";

/**
 * exampleUsingMyLegacyLib
 *
 * Calls legacy UMD-based methods from MyLegacyLib if available on global scope.
 */
export function exampleUsingMyLegacyLib() {
  // Check if MyLegacyLib is present on the global object
  if (typeof globalThis.MyLegacyLib === "undefined") {
    log(
      "MyLegacyLib not found. Did you require('custom-libs/MyLegacyLib.js')?"
    );
    return;
  }

  // Use the global MyLegacyLib's greetLegacy function:
  globalThis.MyLegacyLib.greetLegacy("Evan (Legacy)");

  // Create a legacy person and greet:
  const legacyPerson = new globalThis.MyLegacyLib.OldStylePerson("OldSchool");
  const greeting = legacyPerson.sayHelloLegacy();
  log("Legacy Person says: " + greeting);
}

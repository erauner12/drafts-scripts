/**
 * remove-exports.js
 *
 * Enhanced approach:
 * 1) Remove or rewrite the `export` keyword from lines starting with `export`.
 * 2) If the line is `export { something } from 'somewhere';` => rewrite to:
 *    const { something } = require('somewhere');
 *    globalThis.something = something;
 *    (and so on for multiple exports)
 */
export const removeExportsPlugin = (content) => {
  console.log(
    "[removeExportsPlugin] Removing 'export' statements line-by-line."
  );

  // Split into lines
  const lines = content.split("\n");
  const newLines = [];

  // Helper to handle lines like: export { runX, runY as runZ } from "./someFile";
  // -> converts to:
  //   const { runX, runY: runZ } = require("./someFile");
  //   globalThis.runX = runX;
  //   globalThis.runZ = runZ;
  function rewriteNamedExport(line) {
    // match e.g.: export { nameA, nameB as nameC } from "./somewhere";
    // capturing the stuff inside braces and the path
    // We'll be a bit naive in this regex, but it generally covers the pattern:
    //   export { ... } from "...";
    const match = line.match(
      /^(\s*)export\s*\{\s*([^}]*)\}\s*from\s*["']([^"']+)["']\s*;?/
    );
    if (!match) return null;

    const indent = match[1] || "";
    const exportsList = match[2]; // e.g. "runA, runB as runC"
    const importPath = match[3]; // e.g. "./someFile"

    // We'll create a line:
    //   const { runA, "runB": runC } = require("./someFile");
    // then for each item, a global assignment line: globalThis.runA = runA; ...
    // But we’ll do minimal transformation of "as" usage if present.
    const pieces = exportsList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const requireMapping = pieces
      .map((item) => {
        // possible "as" usage: "foo as bar"
        let asMatch = item.match(/^([^ ]+)\s+as\s+([^ ]+)$/);
        if (asMatch) {
          const original = asMatch[1];
          const renamed = asMatch[2];
          return `${original}: ${renamed}`;
        } else {
          return item; // no as usage
        }
      })
      .join(", ");

    // Build the require line
    let rewritten = `${indent}const { ${requireMapping} } = require("${importPath}");`;

    // Build globalThis lines
    for (const piece of pieces) {
      let asMatch = piece.match(/^([^ ]+)\s+as\s+([^ ]+)$/);
      if (asMatch) {
        const original = asMatch[1];
        const renamed = asMatch[2];
        rewritten += `\n${indent}globalThis.${renamed} = ${renamed};`;
      } else {
        // no "as"
        const name = piece;
        rewritten += `\n${indent}globalThis.${name} = ${name};`;
      }
    }

    return rewritten;
  }

  for (let line of lines) {
    const trimmedLine = line.trimStart();

    if (/^export(\s+|$)/.test(trimmedLine)) {
      // handle lines starting with "export"
      // 1) If it's "export default function foo()", we remove 'export default'
      // 2) If it's a named re-export: "export { x, y } from 'something'"
      //    we transform it to require + global assignments
      // 3) If it's "export { something }" alone, we drop or rewrite
      // 4) Otherwise: remove 'export' for function, class, or var declarations

      // check for "export default" first
      if (/^export\s+default\s+/.test(trimmedLine)) {
        line = line.replace(/^(\s*)export\s+default\s+/, "$1");
        if (!line.trim()) continue;
      }
      // re-export with from
      else if (/^export\s*\{\s*[^}]+\}\s*from\s*["']/.test(trimmedLine)) {
        const rewritten = rewriteNamedExport(line);
        if (rewritten) {
          newLines.push(rewritten);
        }
        continue;
      }
      // "export { a, b };" with no 'from' might be purely a named export object. Typically we remove it entirely.
      else if (/^export\s*\{/.test(trimmedLine)) {
        // e.g. "export { runSomething, runOther };" => we can remove or
        // define them on globalThis if the code is already declared
        console.log(
          "[removeExportsPlugin] Removing named export line or rewriting it. Dropping for safety."
        );
        // To keep them accessible, we'd do something like parse the names and do `globalThis.name = name;`,
        // but that might throw an error if they're not already declared.
        // For now, we drop it.
        continue;
      }
      // "export function Foo()" => remove the "export" keyword
      else {
        line = line.replace(/^(\s*)export\s+/, "$1");
        if (!line.trim()) {
          continue;
        }
      }
    }

    newLines.push(line);
  }

  const finalOutput = newLines.join("\n");
  console.log(
    "[removeExportsPlugin] Finished removing export statements. Final length:",
    finalOutput.length
  );
  return finalOutput;
};

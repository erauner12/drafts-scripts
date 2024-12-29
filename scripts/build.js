import { removeExportsPlugin } from "../plugins/remove-exports";

const ENTRYPOINT = "src/index.ts";
const OUTPATH = "drafts-actions.js";

// do not specify `out` directory to save bundled output in variable, allows for manual
// post-processing
console.log("[build.js] Starting build script...");
try {
  console.log("[build.js] Running Bun.build...");
  const result = await Bun.build({
    entrypoints: [ENTRYPOINT],
    format: "esm",
    sourcemap: "none",
  });
  console.log("[build.js] Build result:\n", result);

  // Check for logs from Bun
  if (result.logs && result.logs.length > 0) {
    console.log("[build.js] The following logs were returned by Bun:\n", result.logs);
  } else {
    console.log("[build.js] No build logs detected from Bun.");
  }

  // If no outputs, we have nothing to write
  if (result.outputs.length === 0) {
    console.log("[build.js] No output artifacts were produced by Bun.build. Exiting early.");
  }

  // For each output, handle text, remove exports, and write to final location
  for (const output of result.outputs) {
    console.log("[build.js] Processing output artifact at:", output.path);
    const bundledText = await output.text();
    console.log("[build.js] Original artifact text length:", bundledText.length);

    // Apply removeExportsPlugin
    const removedExports = removeExportsPlugin(bundledText);

    // Provide a user-friendly preview of the truncated code
    console.log("[build.js] Truncated output preview (first 200 chars):\n", removedExports.slice(0, 200));

    console.log("[build.js] Writing final output to:", OUTPATH);
    await Bun.write(OUTPATH, removedExports);

    console.log("[build.js] Output successfully written to:", OUTPATH);
  }

  console.log("[build.js] Build finished successfully with no reported errors.");
} catch (err) {
  console.error("[build.js] Build failed unexpectedly:\n", err);
}
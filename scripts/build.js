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
  console.log("[build.js] Build result:", result);

  // If nothing in result.logs, let's log it out anyway
  if (result.logs && result.logs.length > 0) {
    console.log("[build.js] Bun build logs:", result.logs);
  } else {
    console.log("[build.js] No build logs detected.");
  }

  if (result.outputs.length === 0) {
    console.log("[build.js] No output artifacts were produced by Bun.build.");
  }

  for (const output of result.outputs) {
    console.log("[build.js] Processing output artifact:", output.path);
    const bundledText = await output.text();
    console.log("[build.js] Artifact text length:", bundledText.length);

    const removedExports = removeExportsPlugin(bundledText);

    // Log first 200 characters of truncated text for debugging
    console.log(
      "[build.js] Partial truncated output preview:",
      removedExports.slice(0, 200)
    );

    console.log("[build.js] Attempting to write to:", OUTPATH);
    await Bun.write(OUTPATH, removedExports);

    // Verify that we wrote the file
    console.log("[build.js] File written:", OUTPATH);
  }

  console.log("[build.js] Build finished with no errors");
} catch (err) {
  console.error("[build.js] Build failed:", err);
}

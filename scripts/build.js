import { removeExportsPlugin } from "../plugins/remove-exports";

const ENTRYPOINT = "src/index.ts";
const OUTPATH = "drafts-actions.js";

// do not specify `out` directory to save bundled output in variable, allows for manual
// post-processing
console.log("Starting build script...");
try {
  console.log("Running Bun.build...");
  const result = await Bun.build({
    entrypoints: [ENTRYPOINT],
    format: "esm",
    sourcemap: "none",
  });
  console.log("Build result:", result);

  // If nothing in result.logs, let's log it out anyway
  if (result.logs && result.logs.length > 0) {
    console.log("Bun build logs:", result.logs);
  } else {
    console.log("No build logs detected.");
  }

  if (result.outputs.length === 0) {
    console.log("No output artifacts were produced by Bun.build.");
  }

  for (const output of result.outputs) {
    console.log("Processing output artifact:", output.path);
    const bundledText = await output.text();
    console.log("Artifact text length:", bundledText.length);

    const removedExports = removeExportsPlugin(bundledText);

    console.log("Attempting to write to:", OUTPATH);
    await Bun.write(OUTPATH, removedExports);

    // Verify that we wrote the file
    console.log("File written:", OUTPATH);
  }

  console.log("Build finished with no errors");
} catch (err) {
  console.error("Build failed:", err);
}

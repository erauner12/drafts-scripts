// function to remove everything after the `export` keyword from the bundled file since
// Drafts can't handle exports
// can be used a a plugin in the rollup config, see
// https://gist.github.com/mtone/c7cb55aaaa2c2702d7b1861d7e2fdbd8 for an example
export const removeExportsPlugin = (content) => {
  // Count how many times "export" appears
  const allMatches = content.match(/export/g) || [];
  console.log(
    "[removeExportsPlugin] Total 'export' occurrences:",
    allMatches.length
  );

  const exportIndex = content.lastIndexOf("export");
  const containsExport = exportIndex !== -1;

  console.log("[removeExportsPlugin] Content length:", content.length);
  console.log("[removeExportsPlugin] exportIndex:", exportIndex);

  if (containsExport) {
    // Print a small snippet around the export index for debugging
    const snippetStart = Math.max(exportIndex - 30, 0);
    const snippetEnd = Math.min(exportIndex + 30, content.length);
    const snippet = content.substring(snippetStart, snippetEnd);
    console.log("[removeExportsPlugin] Excerpt near last export:", snippet);

    const truncated = content.substring(0, exportIndex);
    console.log(
      "[removeExportsPlugin] Removing exports from index:",
      exportIndex
    );
    console.log("[removeExportsPlugin] New content length:", truncated.length);
    return truncated;
  }

  console.log("[removeExportsPlugin] No exports found in this content.");
  return content;
};

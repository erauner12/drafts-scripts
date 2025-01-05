// function to remove everything after the `export` keyword from the bundled file since
// Drafts can't handle exports
// can be used a a plugin in the rollup config, see
// https://gist.github.com/mtone/c7cb55aaaa2c2702d7b1861d7e2fdbd8 for an example
export const removeExportsPlugin = (content) => {
  // Count how many times "export" appears in the bundled text
  const allMatches = content.match(/export/g) || [];
  console.log(
    "[removeExportsPlugin] Detected 'export' occurrences:",
    allMatches.length
  );

  // Find the last occurrence of 'export' if any
  const exportIndex = content.lastIndexOf("export");
  const containsExport = exportIndex !== -1;

  console.log("[removeExportsPlugin] Full content length:", content.length);
  console.log("[removeExportsPlugin] Last exportIndex:", exportIndex);

  if (containsExport) {
    // Provide a short snippet to help the user see the final 'export'
    const snippetStart = Math.max(exportIndex - 30, 0);
    const snippetEnd = Math.min(exportIndex + 30, content.length);
    const snippet = content.substring(snippetStart, snippetEnd);
    console.log("[removeExportsPlugin] Context around last export:\n", snippet);

    // Actually truncate everything after that final 'export'
    const truncated = content.substring(0, exportIndex);
    console.log("[removeExportsPlugin] Truncating from index:", exportIndex);
    console.log(
      "[removeExportsPlugin] Truncated content length:",
      truncated.length
    );
    console.log(
      "[removeExportsPlugin] All code after this index is removed to avoid Drafts export issues."
    );

    return truncated;
  }

  console.log(
    "[removeExportsPlugin] No 'export' found, leaving content as-is."
  );
  return content;
};

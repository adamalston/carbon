// @ts-check

const fs = require('fs');
const { glob } = require('glob');
const { execSync } = require('child_process');

const multipleTocFiles = [];

const startComment =
  "{/* <!-- START doctoc generated TOC please keep comment here to allow auto update --> <!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE --> */}";
const endComment =
  '{/* <!-- END doctoc generated TOC please keep comment here to allow auto update --> */}';

/**
 * Converts HTML comments to JSX comments in the given content.
 * @param {string} content
 * @returns {string}
 */
const convertHTMLtoMDX = (content) =>
  content
    .replace(
      /<!-- START doctoc generated TOC please keep comment here to allow auto update -->\s*<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->/g,
      `${startComment}\n`
    )
    .replace(
      /<!-- END doctoc generated TOC please keep comment here to allow auto update -->/g,
      endComment
    )
    .replace(
      /## Table of Contents\n\n{\/\* <!-- START .* TO UPDATE --> \*\/}\n\n## Table of Contents/g,
      `${startComment}\n\n## Table of Contents`
    );

/**
 * Scans the content for issues.
 * @param {string} content
 * @param {string} file
 */
const scanForIssues = (content, file) => {
  // If a file has multiple TOC comments headings, add it to `multipleTocFiles`.
  const matches = content.match(/## Table of Contents/g);

  if (matches && matches.length > 1) multipleTocFiles.push(file);
};

/**
 * Replaces an unwrapped TOC section with a doctoc-compatible one wrapped in HTML comments.
 * @param {string} content
 * @returns {string}
 */
const injectDoctocWrapper = (content) => {
  if (content.includes('START doctoc')) return content;

  return content.replace(
    /(^## Table of Contents\s*\n)([\s\S]*?)(?=^## )/m,
    (_match, heading, tocBlock) =>
      `${startComment}\n\n${heading}${tocBlock}${endComment}\n\n`
  );
};
/**
 * Replaces an unwrapped TOC section with a doctoc-compatible one wrapped in HTML comments.
 * Ensures proper spacing for Markdown.
 * @param {string} content
 * @returns {string}
 */
// const injectDoctocWrapper = (content) => {
//   if (content.includes('START doctoc')) return content;

//   return content.replace(
//     /(^## Table of Contents\s*\n)([\s\S]*?)(?=^## )/m,
//     (_match, heading, tocBlock) =>
//       `${startComment}\n\n${heading.trimEnd()}\n\n${tocBlock.trim()}\n\n${endComment}\n\n`
//   );
// };

/**
 * Processes a file.
 * @param {string} filePath
 */
const processFile = (filePath) => {
  // Skip overview and feature flag docs.
  if (
    filePath.endsWith('overview.mdx') ||
    filePath.endsWith('.featureflag.mdx')
  )
    return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Step 1: Wrap any unwrapped TOC (preserving its position)
  content = injectDoctocWrapper(content);
  fs.writeFileSync(filePath, content);

  // Step 2: Run doctoc to update the TOC content
  execSync(`yarn doctoc -u "${filePath}"`, { stdio: 'inherit' });

  // Step 3: Convert doctoc HTML comments to JSX-safe versions
  content = fs.readFileSync(filePath, 'utf8');
  const final = convertHTMLtoMDX(content);

  // Step 4: Scan and write
  scanForIssues(final, filePath);
  fs.writeFileSync(filePath, final);
};

(async () => {
  const files = await glob('packages/react/src/components/**/*.mdx');
  // const files = await glob(
  //   'packages/react/src/components/AILabel/AILabelDatatable.mdx'
  // );
  // const files = await glob(
  //   'packages/react/src/components/FluidForm/FluidForm.mdx'
  // );

  files.forEach(processFile);

  if (multipleTocFiles.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `Multiple TOC comments found in the following files: ${multipleTocFiles.join(
        ', '
      )}`
    );
    process.exit(1);
  }
})();

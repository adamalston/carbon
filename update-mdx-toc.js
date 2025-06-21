// @ts-check

const fs = require('fs');
const { glob } = require('glob');
const { execSync } = require('child_process');

const multipleTocFiles = [];

/**
 * Converts HTML comments to JSX comments in the given content.
 * @param {string} content
 * @returns {string}
 */
const convertHTMLtoMDX = (content) =>
  content
    .replace(
      /<!-- START doctoc generated TOC please keep comment here to allow auto update -->\s*<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->/g,
      "{/* <!-- START doctoc generated TOC please keep comment here to allow auto update --> <!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE --> */}\n"
    )
    .replace(
      /<!-- END doctoc generated TOC please keep comment here to allow auto update -->/g,
      '{/* <!-- END doctoc generated TOC please keep comment here to allow auto update --> */}'
    )
    .replace(
      /## Table of Contents\n\n{\/\* <!-- START .* TO UPDATE --> \*\/}\n\n## Table of Contents/g,
      "{/* <!-- START doctoc generated TOC please keep comment here to allow auto update --> <!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE --> */}\n\n## Table of Contents"
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
 * Processes a file.
 * @param {string} filePath
 */
const processFile = (filePath) => {
  execSync(`yarn doctoc "${filePath}"`, { stdio: 'inherit' });

  const content = fs.readFileSync(filePath, 'utf8');
  const converted = convertHTMLtoMDX(content);

  scanForIssues(converted, filePath);

  fs.writeFileSync(filePath, converted);
};

(async () => {
  const files = await glob('packages/react/src/components/**/*.mdx');
  // const files = await glob('packages/react/src/components/Button/Button.mdx');
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

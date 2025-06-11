const fs = require('fs');
const { glob } = require('glob');
const { execSync } = require('child_process');

const MDX_GLOB = 'packages/react/src/components/**/*.mdx';

function convertHTMLtoJSX(content) {
  return content
    .replace(
      /<!-- START doctoc generated TOC please keep comment here to allow auto update -->\s*<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->/g,
      `{/* <!-- START doctoc generated TOC please keep comment here to allow auto update --> <!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE --> */}\n`
    )
    .replace(
      /<!-- END doctoc generated TOC please keep comment here to allow auto update -->/g,
      `{/* <!-- END doctoc generated TOC please keep comment here to allow auto update --> */}`
    );
}

function processFile(filePath) {
  // Run doctoc directly on the file
  execSync(`yarn doctoc -u "${filePath}"`, { stdio: 'inherit' });

  // Read doctoc-updated file and convert comments
  const content = fs.readFileSync(filePath, 'utf8');
  const converted = convertHTMLtoJSX(content);

  fs.writeFileSync(filePath, converted);
}

(async () => {
  const files = await glob(MDX_GLOB);

  files.forEach(processFile);
})();

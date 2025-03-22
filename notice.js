// @ts-check

const { exec } = require('child_process');
const { stat, readFile, writeFile, readdir } = require('fs');
const { extname, join } = require('path');

/**
 * Generates a copyright notice based on creation and modification years.
 * @param {number} createdYear
 * @param {number} modifiedYear
 * @param {number} currentYear
 * @returns {string}
 */
const generateCopyrightNotice = (createdYear, modifiedYear, currentYear) => {
  if (createdYear === currentYear) {
    return `/**
 * Copyright IBM Corp. ${currentYear}
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
\n`;
  } else {
    if (createdYear === modifiedYear) {
      return `/**
 * Copyright IBM Corp. ${createdYear}
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
\n`;
    } else {
      return `/**
 * Copyright IBM Corp. ${createdYear}, ${modifiedYear}
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
\n`;
    }
  }
};

/**
 * Generates an SCSS copyright notice based on creation and modification years.
 * @param {number} createdYear
 * @param {number} modifiedYear
 * @param {number} currentYear
 * @returns {string}
 */
const generateScssCopyrightNotice = (
  createdYear,
  modifiedYear,
  currentYear
) => {
  if (createdYear === currentYear) {
    return `//
// Copyright IBM Corp. ${currentYear}
//
// This source code is licensed under the Apache-2.0 license found in the
// LICENSE file in the root directory of this source tree.
//
\n`;
  } else {
    if (createdYear === modifiedYear) {
      return `//
// Copyright IBM Corp. ${createdYear}
//
// This source code is licensed under the Apache-2.0 license found in the
// LICENSE file in the root directory of this source tree.
//
\n`;
    } else {
      return `//
// Copyright IBM Corp. ${createdYear}, ${modifiedYear}
//
// This source code is licensed under the Apache-2.0 license found in the
// LICENSE file in the root directory of this source tree.
//
\n`;
    }
  }
};

/**
 * Gets the file's creation and last updated years from Git. Falls back to
 * `stat` if Git information isn’t available.
 * @param {string} filePath
 * @param {(err: Error | null, dates?: { createdYear: number, modifiedYear:
 * number }) => void} callback
 */
const getGitDates = (filePath, callback) => {
  const creationDateCommand = `git log --diff-filter=A --format=%aI -- "${filePath}"`;
  /**
   * Commit hash for the last commit in the repository before the initial commit
   * of the changes that this script makes. This script will work without this
   * commit, but adding ensures that others are able to reproduce the same
   * results.
   * https://github.com/carbon-design-system/carbon/commit/f574ad0e46ed2f7d84ba50c8561bd9cb20ffa1b3
   */
  const commitHash = 'f574ad0e46ed2f7d84ba50c8561bd9cb20ffa1b3';
  const lastUpdatedCommand = `git log -1 --format=%aI ${commitHash} -- "${filePath}"`;

  // Command to get the file's creation commit date.
  exec(creationDateCommand, (err, stdout) => {
    if (err || !stdout.trim()) {
      // Fallback to `stat` if Git fails or the file is untracked.
      stat(filePath, (statErr, stats) => {
        if (statErr) {
          return callback(statErr);
        }

        const createdYear = new Date(stats.birthtime).getFullYear();
        const modifiedYear = new Date(stats.mtime).getFullYear();

        return callback(null, { createdYear, modifiedYear });
      });
      return;
    }

    // The earliest commit is the last line of the output.
    const dates = stdout.trim().split('\n');
    const createdDateStr = dates[dates.length - 1];
    const createdYear = new Date(createdDateStr).getFullYear();

    // Now get the most recent commit date.
    exec(lastUpdatedCommand, (err2, stdout2) => {
      if (err2 || !stdout2.trim()) {
        // Fallback to `stat`.
        stat(filePath, (statErr, stats) => {
          if (statErr) {
            return callback(statErr);
          }

          const createdYearFallback = new Date(stats.birthtime).getFullYear();
          const modifiedYearFallback = new Date(stats.mtime).getFullYear();

          return callback(null, {
            createdYear: createdYearFallback,
            modifiedYear: modifiedYearFallback,
          });
        });
        return;
      }

      const modifiedDateStr = stdout2.trim();
      const modifiedYear = new Date(modifiedDateStr).getFullYear();

      return callback(null, { createdYear, modifiedYear });
    });
  });
};

/** Regex for a copyright notice with a single year. */
const oneYearRegex =
  /^\/\*\*\s*\n\s*\*\s*Copyright\s+IBM\s+Corp\.\s+\d{4}\s*\n\s*\*\s*\n\s*\*\s*This\s+source\s+code\s+is\s+licensed\s+under\s+the\s+Apache-2\.0\s+license\s+found\s+in\s+the\s*\n\s*\*\s*LICENSE\s+file\s+in\s+the\s+root\s+directory\s+of\s+this\s+source\s+tree\.\s*\n\s*\*\//;
/** Regex for a copyright notice with two years separated by a comma. */
const twoYearRegex =
  /^\/\*\*\s*\n\s*\*\s*Copyright\s+IBM\s+Corp\.\s+\d{4},\s+\d{4}\s*\n\s*\*\s*\n\s*\*\s*This\s+source\s+code\s+is\s+licensed\s+under\s+the\s+Apache-2\.0\s+license\s+found\s+in\s+the\s*\n\s*\*\s*LICENSE\s+file\s+in\s+the\s+root\s+directory\s+of\s+this\s+source\s+tree\.\s*\n\s*\*\//;

/**
 * Checks if a non-SCSS file has a copyright notices.
 * @param {string} content
 * @returns {boolean}
 */
const hasCopyrightNotice = (content) =>
  oneYearRegex.test(content) || twoYearRegex.test(content);

/**
 * SCSS regex that ignores the actual year numbers by matching any 4-digit
 * number, optionally followed by a comma and another 4-digit number.
 */
const scssRegex = new RegExp(
  '^//\\s*\\n' +
    '//\\s*Copyright\\s+IBM\\s+Corp\\.\\s+\\d{4}(?:,\\s*\\d{4})?\\s*\\n' +
    '//\\s*\\n' +
    '//\\s*This\\s+source\\s+code\\s+is\\s+licensed\\s+under\\s+the\\s+Apache-2\\.0\\s+license\\s+found\\s+in\\s+the\\n' +
    '//\\s*LICENSE\\s+file\\s+in\\s+the\\s+root\\s+directory\\s+of\\s+this\\s+source\\s+tree\\.\\s*\\n' +
    '//'
);

/**
 * Checks if an SCSS file has a copyright notices.
 * @param {string} content
 * @returns {boolean}
 */
const hasScssCopyrightNotice = (content) => scssRegex.test(content);

/**
 * Processes a non-SCSS file by adding a dynamic copyright notice if missing.
 * @param {string} filePath
 */
const processFile = (filePath) => {
  readFile(filePath, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error(`Error reading ${filePath}: ${readErr}`);
      return;
    }

    // Skip files in `__tests__` directories that have the `@jest-environment
    // node` docblock.
    if (
      filePath.includes('__tests__') &&
      data.includes('@jest-environment node')
    ) {
      console.log(
        `Skipping test file with @jest-environment node: ${filePath}`
      );
      return;
    }

    if (hasCopyrightNotice(data)) {
      console.log(`Already has copyright notice: ${filePath}`);
    } else {
      // Use Git to get creation and modification years.
      getGitDates(filePath, (err, dates) => {
        if (err || !dates) {
          console.error(
            `Error getting git dates for ${filePath}: ${err || 'No result'}`
          );
          return;
        }

        const { createdYear, modifiedYear } = dates;
        const currentYear = new Date().getFullYear();
        const copyrightNotice = generateCopyrightNotice(
          createdYear,
          modifiedYear,
          currentYear
        );
        const updatedContent = `${copyrightNotice}${data}`;

        writeFile(filePath, updatedContent, 'utf8', (writeErr) => {
          if (writeErr) {
            console.error(`Error writing ${filePath}: ${writeErr}`);
          } else {
            console.log(`Added copyright notice to ${filePath}`);
          }
        });
      });
    }
  });
};

/**
 * Processes an SCSS file by adding a dynamic SCSS copyright notice if missing.
 * @param {string} filePath
 */
const processScssFile = (filePath) => {
  readFile(filePath, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error(`Error reading ${filePath}: ${readErr}`);
      return;
    }

    // Skip files that contain the generated comment.
    if (data.includes('Code generated by @carbon/react. DO NOT EDIT.')) {
      console.log(`Skipping generated SCSS file: ${filePath}`);
      return;
    }

    if (hasScssCopyrightNotice(data)) {
      console.log(`Already has SCSS copyright notice: ${filePath}`);
    } else {
      getGitDates(filePath, (err, dates) => {
        if (err || !dates) {
          console.error(
            `Error getting git dates for ${filePath}: ${err || 'No result'}`
          );
          return;
        }

        const { createdYear, modifiedYear } = dates;
        const currentYear = new Date().getFullYear();
        const copyrightNotice = generateScssCopyrightNotice(
          createdYear,
          modifiedYear,
          currentYear
        );
        const updatedContent = `${copyrightNotice}${data}`;

        writeFile(filePath, updatedContent, 'utf8', (writeErr) => {
          if (writeErr) {
            console.error(`Error writing ${filePath}: ${writeErr}`);
          } else {
            console.log(`Added SCSS copyright notice to ${filePath}`);
          }
        });
      });
    }
  });
};

/**
 * Recursively traverses the directory, processing files as needed.
 * @param {string} dir
 */
const traverseDirectory = (dir) => {
  readdir(dir, { withFileTypes: true }, (err, entries) => {
    if (err) {
      console.error(`Error reading directory ${dir}: ${err}`);
      return;
    }

    entries.forEach((entry) => {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip certain directories.
        if (entry.name === '__snapshots__') {
          return;
        }

        traverseDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.scss'];
        if (!allowedExtensions.includes(ext)) {
          return;
        }

        // Process `scss` files separately from other files given the different
        // comment syntax: https://sass-lang.com/documentation/syntax/comments/.
        if (ext === '.scss') {
          processScssFile(fullPath);
        } else {
          processFile(fullPath);
        }
      }
    });
  });
};

(() => {
  traverseDirectory(join(__dirname, 'packages/react'));
})();

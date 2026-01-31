const { readdirSync, readFileSync } = require('node:fs');
const { dirname, join, posix, relative, sep } = require('node:path');

/**
 * @param {string} filePath
 * @returns {string}
 */
const normalizePath = (filePath) => filePath.split(sep).join('/');

/**
 * @param {string} rawLine
 * @returns {{ line: string, negated: boolean } | null}
 */
const normalizeGitignoreLine = (rawLine) => {
  const trimmedLine = rawLine.trim();
  if (!trimmedLine || trimmedLine.startsWith('#')) return null;

  const negated = trimmedLine.startsWith('!');
  const unescapedLine =
    trimmedLine.startsWith('\\#') || trimmedLine.startsWith('\\!')
      ? trimmedLine.slice(1)
      : trimmedLine;
  const line = negated ? unescapedLine.slice(1) : unescapedLine;

  return { line, negated };
};

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
const findGitignoreFiles = (rootDir) => {
  const gitignoreFiles = [];
  const pendingDirs = [rootDir];

  // Traverse the repo tree, skipping directories that shouldn't affect ignore
  // rules.
  while (pendingDirs.length) {
    const currentDir = pendingDirs.pop();

    if (!currentDir) break;

    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '.gitignore') {
        gitignoreFiles.push(join(currentDir, entry.name));
        continue;
      }

      if (!entry.isDirectory() || entry.isSymbolicLink()) {
        continue;
      }

      if (entry.name === '.git' || entry.name === 'node_modules') {
        continue;
      }

      pendingDirs.push(join(currentDir, entry.name));
    }
  }

  return gitignoreFiles;
};

/**
 * @param {string} gitignoreFile
 * @param {string} repoRoot
 */
const parseNestedGitignore = (gitignoreFile, repoRoot) => {
  const dirRelative = relative(repoRoot, dirname(gitignoreFile));
  if (!dirRelative) return [];

  const dirPrefix = normalizePath(dirRelative);
  const rawLines = readFileSync(gitignoreFile, 'utf8').split(/\r?\n/);
  const patterns = [];

  for (const rawLine of rawLines) {
    const normalized = normalizeGitignoreLine(rawLine);

    if (!normalized) continue;

    const { line, negated } = normalized;

    const isAnchored = line.startsWith('/');
    const unanchoredLine = isAnchored ? line.slice(1) : line;

    const hasSlash = unanchoredLine.includes('/');
    const isDir = unanchoredLine.endsWith('/');
    const patternBase = hasSlash
      ? posix.join(dirPrefix, unanchoredLine)
      : posix.join(dirPrefix, '**', unanchoredLine);
    const pattern = isDir ? `${patternBase}**` : patternBase;

    patterns.push(negated ? `!${pattern}` : pattern);
  }

  return patterns;
};

module.exports = {
  normalizePath,
  normalizeGitignoreLine,
  findGitignoreFiles,
  parseNestedGitignore,
};

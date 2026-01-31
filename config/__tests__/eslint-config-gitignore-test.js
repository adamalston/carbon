/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import {
  normalizePath,
  normalizeGitignoreLine,
  findGitignoreFiles,
  parseNestedGitignore,
} from '../eslint/gitignore.cjs';

describe('parseNestedGitignore', () => {
  it('expands nested .gitignore patterns with anchors, negation, and dirs', () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'gitignore-test-'));
    const nestedDir = join(repoRoot, 'a', 'b');
    mkdirSync(nestedDir, { recursive: true });

    const gitignoreFile = join(nestedDir, '.gitignore');
    writeFileSync(
      gitignoreFile,
      [
        '# comment',
        '',
        'dist/',
        '!dist/keep.js',
        '/anchored.txt',
        'unanchored.txt',
        'foo/bar.js',
        '\\#literal',
        '\\!literal',
      ].join('\n'),
      'utf8'
    );

    const patterns = parseNestedGitignore(gitignoreFile, repoRoot);

    expect(patterns).toEqual([
      'a/b/dist/**',
      '!a/b/dist/keep.js',
      'a/b/**/anchored.txt',
      'a/b/**/unanchored.txt',
      'a/b/foo/bar.js',
      'a/b/**/#literal',
      'a/b/**/!literal',
    ]);
  });

  it('treats anchored patterns as relative to the gitignore directory', () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'gitignore-anchored-'));
    const nestedDir = join(repoRoot, 'packages', 'ui');
    mkdirSync(nestedDir, { recursive: true });

    const gitignoreFile = join(nestedDir, '.gitignore');
    writeFileSync(
      gitignoreFile,
      ['/one.txt', 'two.txt', 'dir/'].join('\n'),
      'utf8'
    );

    const patterns = parseNestedGitignore(gitignoreFile, repoRoot);

    expect(patterns).toEqual([
      'packages/ui/**/one.txt',
      'packages/ui/**/two.txt',
      'packages/ui/dir/**',
    ]);
  });

  it('returns an empty list for a root .gitignore', () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'gitignore-root-'));
    const gitignoreFile = join(repoRoot, '.gitignore');
    writeFileSync(gitignoreFile, 'dist/\n', 'utf8');

    const patterns = parseNestedGitignore(gitignoreFile, repoRoot);

    expect(patterns).toEqual([]);
  });
});

describe('normalizeGitignoreLine', () => {
  it('ignores blank lines and comments', () => {
    expect(normalizeGitignoreLine('')).toBeNull();
    expect(normalizeGitignoreLine('   ')).toBeNull();
    expect(normalizeGitignoreLine('# comment')).toBeNull();
  });

  it('handles negation and escaped markers', () => {
    expect(normalizeGitignoreLine('!dist/')).toEqual({
      line: 'dist/',
      negated: true,
    });
    expect(normalizeGitignoreLine('\\#literal')).toEqual({
      line: '#literal',
      negated: false,
    });
    expect(normalizeGitignoreLine('\\!literal')).toEqual({
      line: '!literal',
      negated: false,
    });
  });
});

describe('normalizePath', () => {
  it('normalizes path separators to forward slashes', () => {
    if (sep === '\\') {
      expect(normalizePath('a\\b\\c')).toBe('a/b/c');
    } else {
      expect(normalizePath('a\\b\\c')).toBe('a\\b\\c');
    }
    expect(normalizePath('a/b/c')).toBe('a/b/c');
  });
});

describe('findGitignoreFiles', () => {
  it('skips node_modules and .git directories', () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'gitignore-find-'));
    const srcDir = join(repoRoot, 'src');
    const nodeModulesDir = join(repoRoot, 'node_modules', 'pkg');
    const gitDir = join(repoRoot, '.git');

    mkdirSync(srcDir, { recursive: true });
    mkdirSync(nodeModulesDir, { recursive: true });
    mkdirSync(gitDir, { recursive: true });

    writeFileSync(join(repoRoot, '.gitignore'), 'root\n', 'utf8');
    writeFileSync(join(srcDir, '.gitignore'), 'src\n', 'utf8');
    writeFileSync(join(nodeModulesDir, '.gitignore'), 'nm\n', 'utf8');
    writeFileSync(join(gitDir, '.gitignore'), 'git\n', 'utf8');

    const found = findGitignoreFiles(repoRoot);

    expect(found).toEqual(
      expect.arrayContaining([
        join(repoRoot, '.gitignore'),
        join(srcDir, '.gitignore'),
      ])
    );
    expect(found).not.toEqual(
      expect.arrayContaining([
        join(nodeModulesDir, '.gitignore'),
        join(gitDir, '.gitignore'),
      ])
    );
  });

  it('does not traverse symbolic links when supported', () => {
    const { symlinkSync } = require('node:fs');

    const repoRoot = mkdtempSync(join(tmpdir(), 'gitignore-symlink-'));
    const targetDir = join(repoRoot, 'target');
    const symlinkDir = join(repoRoot, 'link');

    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, '.gitignore'), 'target\n', 'utf8');

    try {
      symlinkSync(targetDir, symlinkDir, 'dir');
    } catch (error) {
      return;
    }

    const found = findGitignoreFiles(repoRoot);

    expect(found).toEqual(
      expect.arrayContaining([join(repoRoot, 'target', '.gitignore')])
    );
    expect(found).not.toEqual(
      expect.arrayContaining([join(symlinkDir, '.gitignore')])
    );
  });
});

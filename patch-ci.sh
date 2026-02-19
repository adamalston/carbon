#!/usr/bin/env bash
set -euo pipefail

stage_changes=true

if [[ "${1:-}" == "--no-stage" ]]; then
  stage_changes=false
elif [[ "${1:-}" != "" ]]; then
  echo "Usage: $0 [--no-stage]" >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
workflow_file="${repo_root}/.github/workflows/ci.yml"

if [[ ! -f "$workflow_file" ]]; then
  echo "Could not find workflow file at $workflow_file" >&2
  exit 1
fi

perl -i -0777 -pe '
  # Allow push events from forks.
  s/(^\s*push:\n(?:(?!^\s*pull_request:).*\n)*?^\s*branches:\n(?:(?!^\s*pull_request:).*\n)*?^\s*-\s*)main\b/$1"**"/m;

  # Fall back to standard runners for forks.
  s/\bubuntu-latest-larger-disk\b/ubuntu-latest/g;

  # Reduce memory pressure on default runners for yarn build steps.
  s/^(\s+)- name: Build project\n(\1  if:[^\n]*\n)?(?!\1  env:\n)(\1  run: yarn build\s*$)/$1- name: Build project\n$2$1  env:\n$1    NX_PARALLEL: 3\n$1    NODE_OPTIONS: --max-old-space-size=6144\n$3/mg;

  # Run test jobs sequentially.
  s/^  web-components-test:\n(?!    needs:)/  web-components-test:\n    needs: test\n/m;
  s/^  e2e:\n(?!    needs:)/  e2e:\n    needs: web-components-test\n/m;

  # Limit AVT/VRT fan-out to two shards at once.
  s/(^  vrt-runner:\n    strategy:\n      fail-fast: false\n)(?!      max-parallel:)/$1      max-parallel: 2\n/m;
  s/(^  avt-runner:\n    strategy:\n      fail-fast: false\n)(?!      max-parallel:)/$1      max-parallel: 2\n/m;
' "$workflow_file"

if [[ "$stage_changes" == "true" ]]; then
  git -C "$repo_root" add .github/workflows/ci.yml
  echo "Patched and staged .github/workflows/ci.yml"
else
  echo "Patched .github/workflows/ci.yml"
fi

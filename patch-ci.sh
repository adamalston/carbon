#!/usr/bin/env bash
set -euo pipefail

readonly WORKFLOW_RELATIVE_PATH=".github/workflows/ci.yml"

usage() {
  echo "Usage: ${0##*/} [--no-stage]"
}

die() {
  echo "$*" >&2
  exit 1
}

patch_workflow() {
  local workflow_file="$1"

  perl -i -0777 -pe '
    # Allow push events from forks.
    s/(^\s*push:\n(?:(?!^\s*pull_request:).*\n)*?^\s*branches:\n(?:(?!^\s*pull_request:).*\n)*?^\s*-\s*)main\b/$1"**"/m;

    # Remove workflow-level concurrency.
    s/^concurrency:\n  group:.*\n  cancel-in-progress:.*\n\n//m;

    # Use ubuntu-22.04 for all jobs.
    s/\bubuntu-latest-larger-disk\b/ubuntu-22.04/g;
    s/\bubuntu-latest\b(?!-)/ubuntu-22.04/g;

    # Keep dedupe/format/lint parallel, then continue downstream sequencing.
    s/^  format:\n(?:    needs:.*\n)?/  format:\n/m;
    s/^  lint:\n(?:    needs:.*\n)?/  lint:\n/m;
    s/^  test:\n(?:    needs:.*\n)?/  test:\n    needs: lint\n/m;
    s/^  web-components-test:\n(?:    needs:.*\n)?/  web-components-test:\n    needs: test\n/m;
    s/^  e2e:\n(?:    needs:.*\n)?/  e2e:\n    needs: web-components-test\n/m;
    s/^  vrt-runner:\n(?:    needs:.*\n)?/  vrt-runner:\n    needs: e2e\n/m;
    s/^  avt-runner:\n(?:    needs:.*\n)?/  avt-runner:\n    needs: vrt\n/m;
    s/(^  merge-playwright-reports:\n(?:    #.*\n)?)    if:\n(?:      .*\n)*?    needs: [^\n]*\n/$1    if: \${{ false }}\n    needs: avt\n/m;
    s/^  chromatic-react:\n(?:    needs:.*\n)?(?:    if:\n(?:      .*\n)*|    if:.*\n)?/  chromatic-react:\n    needs: avt\n    if: \${{ false }}\n/m;
    s/^  react-storybook-preview:\n(?:    if:.*\n)?/  react-storybook-preview:\n    if: \${{ false }}\n/m;

    # Serialize shards for VRT/AVT.
    s/(^  vrt-runner:\n    needs: e2e\n    strategy:\n      fail-fast: false\n)(?:      max-parallel:\s*\d+\n)?/$1      max-parallel: 1\n/m;
    s/(^  avt-runner:\n    needs: vrt\n    strategy:\n      fail-fast: false\n)(?:      max-parallel:\s*\d+\n)?/$1      max-parallel: 1\n/m;
  ' "${workflow_file}"
}

main() {
  local stage_changes=1
  local repo_root
  local workflow_file

  if [[ $# -gt 1 ]]; then
    usage >&2
    return 1
  fi

  if [[ $# -eq 1 ]]; then
    case "$1" in
      --no-stage)
        stage_changes=0
        ;;
      -h | --help)
        usage
        return 0
        ;;
      *)
        usage >&2
        return 1
        ;;
    esac
  fi

  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
  workflow_file="${repo_root}/${WORKFLOW_RELATIVE_PATH}"
  if [[ ! -f "${workflow_file}" ]]; then
    die "Could not find workflow file at ${workflow_file}"
  fi

  patch_workflow "${workflow_file}"

  if (( stage_changes )); then
    git -C "${repo_root}" add "${WORKFLOW_RELATIVE_PATH}"
    echo "Patched and staged ${WORKFLOW_RELATIVE_PATH}"
    return 0
  fi

  echo "Patched ${WORKFLOW_RELATIVE_PATH}"
}

main "$@"

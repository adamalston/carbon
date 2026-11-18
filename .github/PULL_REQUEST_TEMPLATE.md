Partially addresses https://github.com/carbon-design-system/carbon/issues/19011

Aligned React's TypeScript JSX mode with Babel's classic runtime to avoid unused `React` warnings during the TypeScript migration, and centralized `@testing-library/jest-dom` matcher setup for the tests.

### Changelog

**New**

- Added a `typecheck` script to `@carbon/react`.
- Moved shared React test helpers into `packages/react/test-utils`.

**Changed**

- Set the React package's TypeScript JSX mode to `react` to match Babel's classic runtime.
- Registered `@testing-library/jest-dom` matchers in the shared TypeScript Jest setup and removed the repeated imports from test files.

#### Testing / Reviewing

```sh
yarn workspace @carbon/react typecheck
yarn test packages/react
```

## PR Checklist

<!--
  Do not remove checklist items.
  If some are incomplete, create a draft pull request using the create button dropdown.
  If some do not apply, ~~strike through the item text with tildes~~.
-->

As the author of this PR, before marking ready for review, confirm you:

- [ ] Reviewed every line of the diff
- [ ] ~~Updated documentation and storybook examples~~
- [ ] ~~Followed the
      [required v12 migration documentation](https://github.com/carbon-design-system/carbon/blob/main/docs/working-with-v12.md#required-v12-migration-documentation)
      for any code change that affects v12, or struck through this item because
      the PR does not affect v12~~
- [ ] Wrote passing tests that cover this change
- [ ] ~~Addressed any impact on accessibility (a11y)~~
- [ ] ~~Tested for cross-browser consistency~~
- [ ] Validated that this code is ready for review and status checks should pass

More details can be found in the [pull request guide](https://github.com/carbon-design-system/carbon/blob/main/docs/guides/reviewing-pull-requests.md).

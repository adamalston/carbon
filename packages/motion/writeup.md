I ported the source to TypeScript to generate consumer type definitions directly
from source. The build is split: Rollup (via `carbon-cli` bundle) handles
JavaScript output, while `tsc` is used only to emit `.d.ts` files. This avoids a
Rollup error that happens when `declarationDir` is set in the config Rollup
reads.

A separate `tsconfig.types.json` exists so Rollup reads a declaration-free
`tsconfig.json`, while `tsc` emits declarations into `lib/`. The `package.json`
`types` field points to `lib/index.d.ts`, keeping the declarations colocated
with the CommonJS build output.

# @imcauan/typescript-config

Shared `tsconfig` bases for TypeScript libraries and apps.

## Install

```bash
pnpm add -D @imcauan/typescript-config typescript
```

See the [root README](../../README.md#install) to set up the GitHub Packages
registry.

## Usage

Extend one of the configs from your `tsconfig.json`:

```jsonc
{
  "extends": "@imcauan/typescript-config/base.json",
  "include": ["src"],
}
```

| Config                | For                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `base.json`           | Libraries and anything without a framework: strict mode, `noUncheckedIndexedAccess`, ES2022, bundler resolution, declarations |
| `nest.json`           | NestJS apps: `base.json` plus decorator metadata and NestJS's relaxed defaults (`noImplicitAny: false`)                       |
| `react-library.json`  | React libraries: `base.json` plus `jsx: react-jsx`                                                                            |
| `tanstack-start.json` | TanStack Start and Vite apps: `noEmit`, `verbatimModuleSyntax`, `vite/client` types                                           |

The configs don't set `paths`, `outDir`, `include` or other values that
depend on your folder layout. Set them in your own `tsconfig.json`:

```jsonc
{
  "extends": "@imcauan/typescript-config/tanstack-start.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] },
  },
  "include": ["src"],
}
```

## API

- `@imcauan/typescript-config/base.json`
- `@imcauan/typescript-config/nest.json`
- `@imcauan/typescript-config/react-library.json`
- `@imcauan/typescript-config/tanstack-start.json`

## Design notes

This package ships static JSON files, not a `dist` build. It's a named
exception to the [constitution](../../CONSTITUTION.md#exceptions).

## License

MIT

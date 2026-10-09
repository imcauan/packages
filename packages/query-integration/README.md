# @imcauan/query-integration

Declares [TanStack Query](https://tanstack.com/query) options on use-case
classes with decorators, and runs those classes as queries and mutations with
React hooks that resolve them from
[`@imcauan/dependency-injection`](../dependency-injection).

## Install

```bash
pnpm add @imcauan/query-integration @tanstack/query-core reflect-metadata
```

For the React hooks (`@imcauan/query-integration/react`):

```bash
pnpm add @tanstack/react-query
```

| Peer                    | Range                  | Needed for                       |
| ----------------------- | ---------------------- | -------------------------------- |
| `@tanstack/query-core`  | `^5.90.0`              | Required (option types)          |
| `reflect-metadata`      | `^0.2.0`               | Required (stores the options)    |
| `@tanstack/react-query` | `^5.90.0`              | `/react`                         |
| `react`                 | `^18.2.0 \|\| ^19.0.0` | `/react` (your React app has it) |

Import `reflect-metadata` once, before any decorated class loads, for
example at the top of your entry file:

```ts
import 'reflect-metadata';
```

The package doesn't import it itself, so your app loads one copy.
`@imcauan/dependency-injection` is a regular dependency. See the
[root README](../../README.md#install) to set up the GitHub Packages registry.

## Usage

A use case is any class with an `execute` method. Decorate it with the
TanStack Query options that belong to it, so every screen that runs it
shares them:

```ts
import { CommandOptions, QueryOptions } from '@imcauan/query-integration';

@QueryOptions({
  queryKey: (id: string) => ['products', id],
  staleTime: 30_000,
})
export class LoadProduct {
  execute(id: string): Promise<Product> {
    // ...
  }
}

@CommandOptions({
  mutationKey: ['products', 'create'],
  invalidates: [['products']],
})
export class CreateProduct {
  execute(input: NewProduct): Promise<Product> {
    // ...
  }
}
```

- `@QueryOptions` takes TanStack Query's query options, with `queryKey` as a
  key or a function of the query's params, and an `onError` called when
  `execute` throws.
- `@CommandOptions` takes TanStack Query's mutation options, plus
  `invalidates`: the query keys to invalidate after success, or a function
  of `{ variables, result }` that returns them.

The decorators only store options: they don't register the class anywhere.
Subclasses inherit them, and a subclass's own decorator replaces them.
`getQueryOptions(classOrInstance)` and `getCommandOptions(classOrInstance)`
read them back.

## Integrations

### React

Register the use cases in your DI module under tokens, render a
`DependencyProvider` and a `QueryClientProvider`, then run them by token:

```tsx
import { useCommand, useQuery } from '@imcauan/query-integration/react';

function ProductPage({ id }: { id: string }) {
  const product = useQuery({ token: LoadProductToken, params: id });
  const create = useCommand({ token: CreateProductToken });

  // product.data: Product | undefined
  // create.mutate(input: NewProduct)
}
```

- `useQuery` resolves the token, calls `execute(params)` as the query
  function, and caches the result under the resolved `queryKey`. `params` is
  required exactly when `execute` takes a parameter.
- `useCommand` calls `execute(variables)` as the mutation function, then
  invalidates the class's `invalidates` keys before your `onSuccess` runs.
- Options passed to a hook override the class's. When both define a
  callback (`onSuccess`, `onError`, `onSettled`, `onMutate`), the class's runs
  first, then the hook's.
- Params, data, variables and results are typed from `execute`.

`useQuery` throws a `QueryIntegrationError` when neither the class nor the
hook gives a `queryKey`, or when the key is a function and there are no
params.

## API

`@imcauan/query-integration`

- `QueryOptions(options)`, `CommandOptions(options)`: class decorators.
- `getQueryOptions(target)`, `getCommandOptions(target)`: read the options
  of a class or instance.
- `QueryMetadata`, `CommandMetadata`, `ExecutableQueryMetadata`,
  `ExecutableCommandMetadata`: the option types.
- `QueryKeyResolver`, `InvalidationResolver`: key and invalidation options.
- `Executable`, `ExecuteArgs`, `ExecuteParams`, `ExecuteResult`,
  `QueryParamsOption`: types derived from an `execute` method.

`@imcauan/query-integration/react`

- `useQuery({ token, params?, ...options })`: TanStack Query's `useQuery`
  for a use case.
- `useCommand({ token, ...options })`: TanStack Query's `useMutation` for a
  use case.
- `UseQueryOptions`, `UseCommandOptions`: their options.

## Design notes

- Options are stored with `reflect-metadata`, which looks up base classes,
  so subclasses inherit them.
- The core's types come from `@tanstack/query-core`, which every TanStack
  Query adapter shares, so the decorators don't tie a use case to React.
- The decorators work with both TypeScript's `experimentalDecorators` and
  standard decorators.

## License

MIT

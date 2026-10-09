# @imcauan/form

Validates [react-hook-form](https://react-hook-form.com) forms with
[`@imcauan/validation`](../validation) schemas: a resolver, and a `useForm`
hook for React that wires it in.

## Install

```bash
pnpm add @imcauan/form react-hook-form
```

| Peer              | Range                  | Needed for                       |
| ----------------- | ---------------------- | -------------------------------- |
| `react-hook-form` | `^7.55.0`              | Required                         |
| `react`           | `^18.2.0 \|\| ^19.0.0` | `/react` (your React app has it) |

`@imcauan/validation` is a regular dependency and installs with the package.
See the [root README](../../README.md#install) to set up the GitHub Packages
registry.

## Usage

`validationResolver(schema)` is a react-hook-form `resolver`. Pass it to
react-hook-form's own `useForm`, or to anything else that takes a resolver:

```ts
import { v } from '@imcauan/validation';
import { validationResolver } from '@imcauan/form';
import { useForm } from 'react-hook-form';

const signInSchema = v.object({
  email: v.string().email({ error: 'Enter a valid email' }),
  password: v.string().min({ value: 8, error: 'At least 8 characters' }),
});

const form = useForm({ resolver: validationResolver(signInSchema) });
```

Each validation issue becomes an error on the field at its path, nested for
nested fields (`errors.address.city`), with the issue's code as `type` and
its message as `message`. A field shows its first issue. When the values
are valid, the submit handler gets the schema's parsed output.

The resolver module imports nothing at runtime besides the schema you pass,
so it doesn't load React.

## Integrations

### React

`useForm` is react-hook-form's `useForm` with a `schema` option in place of
`resolver`:

```tsx
import { useForm } from '@imcauan/form/react';

export function SignInForm() {
  const { register, handleSubmit, formState } = useForm({
    schema: signInSchema,
    defaultValues: { email: '', password: '' },
  });

  return (
    <form onSubmit={handleSubmit(values => signIn(values))}>
      <input {...register('email')} />
      {formState.errors.email?.message}
      {/* ... */}
    </form>
  );
}
```

It takes every other react-hook-form option and returns react-hook-form's
`UseFormReturn`.

## API

`@imcauan/form`

- `validationResolver(schema)`: a react-hook-form `Resolver` for the schema.

`@imcauan/form/react`

- `useForm(options)`: react-hook-form's `useForm`, validated by
  `options.schema`.
- `UseFormOptions<T>`: react-hook-form's `UseFormProps<T>` plus `schema`.

## Design notes

- The package doesn't re-export react-hook-form's types. Import
  `UseFormReturn`, `FieldValues` and the rest from `react-hook-form`.
- `react-hook-form` is a required peer, not a dependency, so your app and
  this package share one copy (react-hook-form keeps state in React context).

## License

MIT

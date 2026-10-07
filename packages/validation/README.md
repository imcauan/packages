# @imcauan/validation

Schema validation with type inference and
[Standard Schema](https://standardschema.dev) support, without third-party
validators.

## Install

```bash
pnpm add @imcauan/validation
```

No dependencies or peers. See the [root README](../../README.md#install) to set
up the GitHub Packages registry.

## Usage

Build schemas with the `v` builder and infer their type with `Infer`:

```ts
import { v, type Infer } from '@imcauan/validation';

export const createProductSchema = v.object({
  name: v.string({ requiredError: 'name_required' }).max({
    value: 100,
    error: 'name_too_long',
  }),
  price: v
    .number({ requiredError: 'price_required' })
    .coerce({ error: 'price_invalid' })
    .min({ value: 0, error: 'price_negative' }),
  status: v.oneOf(['draft', 'published'] as const).default('draft'),
  description: v.string().optional(),
});

export type CreateProduct = Infer<typeof createProductSchema>;
// { name: string; price: number; status: 'draft' | 'published'; description: string | undefined }
```

### Validating

`validate` returns the typed value or throws a `ValidationError`:

```ts
const product = createProductSchema.validate(input);
```

`safeValidate` never throws:

```ts
const result = createProductSchema.safeValidate(input);

if (!result.success) {
  console.log(result.issues);
  // [{ path: ['price'], code: 'too_small', message: 'price_negative' }]
}
```

`parse` and `safeParse` are aliases, for libraries that expect those names.
A `ValidationError`'s `message` joins its issue messages with `, `.

### Objects

Objects return only the keys their shape declares, and never change the
input. Add cross-field rules with `check`, and combine shapes with `extend`:

```ts
const rangeSchema = v
  .object({ start: v.number(), end: v.number() })
  .check((range, ctx) => {
    if (range.end < range.start) {
      ctx.addIssue({ path: ['end'], message: 'end_before_start' });
    }
  });
```

### Transforms

`transform` maps a validated value to another type, after the source schema
has validated it:

```ts
const tagsSchema = v.string().transform(value => value.split(','));
```

### Common formats

```ts
v.email({ error: 'invalid_email' });
v.url({ error: 'invalid_url' });
v.uuid({ error: 'invalid_id' });
v.password({ error: 'weak_password' }); // 8+ chars, lower, upper, digit, symbol
```

### Environment variables

```ts
const environmentSchema = v.object({
  PORT: v.env.port(3000), // coerced, integer 1–65535, defaults to 3000
  CORS_ORIGINS: v.env.csv(''), // 'a, b,' → ['a', 'b']
  DATABASE_URL: v.string({ requiredError: 'database_url_required' }),
});
```

For a typed, validated environment object, see
[`@imcauan/environment`](../environment).

### Standard Schema

Every schema implements Standard Schema v1 (`schema['~standard']`, vendor
`imcauan`), so libraries that accept Standard Schema validators can use these
schemas directly.

## API

- `v`: the schema builder.
  - `v.string()`: `min`, `max`, `regex`, `email`, `url`, `transform`,
    `default`; an empty string counts as missing.
  - `v.number()`: `coerce`, `int`, `min`, `max`.
  - `v.boolean()`
  - `v.oneOf(values)`: a tuple (`as const`) or an object of allowed strings.
  - `v.object(shape)`: `check`, `extend`.
  - `v.email()`, `v.url()`, `v.uuid()`, `v.password()`
  - `v.env.port(default?)`, `v.env.csv(default?)`
- Every schema: `validate`, `safeValidate`, `parse`, `safeParse`,
  `optional`, `default`, `['~standard']`.
- `Infer<typeof schema>`: the output type of a schema.
- `ValidationError`, `ValidationIssue`, `ValidationPath`,
  `ValidationResult<T>`: errors and results.
- `Schema<T>`, `StringSchemaApi`, `NumberSchemaApi`, `ObjectSchemaApi`,
  `CheckContext`: schema types.

## Design notes

- **Error messages are keys, not prose.** Each rule takes the message to
  report (`'price_negative'`), so apps can translate them.
- **Missing values** are `undefined`, plus `''` for strings and coerced
  numbers. A missing value fails with `required` unless the schema is
  `optional()` or has a `default()`.
- Builder methods return new schemas; they never change the one they're
  called on.
- How schemas work internally:
  [docs/INTERNAL_FLOW.md](docs/INTERNAL_FLOW.md).

## License

MIT

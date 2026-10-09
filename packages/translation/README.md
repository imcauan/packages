# @imcauan/translation

Typed translators: an adapter for [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
message catalogs, and a NestJS adapter and module built on
[`nestjs-i18n`](https://nestjs-i18n.com).

## Install

```bash
pnpm add @imcauan/translation
```

The core has no dependencies. For the NestJS integration
(`@imcauan/translation/nestjs`):

```bash
pnpm add nestjs-i18n
```

| Peer                             | Range     | Needed for                           |
| -------------------------------- | --------- | ------------------------------------ |
| `@nestjs/common`, `@nestjs/core` | `^12.0.0` | `/nestjs` (your NestJS app has them) |
| `nestjs-i18n`                    | `^10.8.0` | `/nestjs`                            |

All of them are optional peers. See the [root README](../../README.md#install)
to set up the GitHub Packages registry.

## Usage

`ParaglideTranslatorAdapter` wraps a message catalog shaped like Paraglide's
generated `messages` module: each message is a function that returns a
string. Message keys and their parameters are inferred from the catalog:

```ts
import { ParaglideTranslatorAdapter } from '@imcauan/translation';
import * as messages from './paraglide/messages';

const translator = new ParaglideTranslatorAdapter(messages);

translator.translate('greeting', { name: 'Ada' });
// 'greeting' must be a message, and { name } its parameters
```

Only keys of string-returning functions are accepted, so other exports of
the generated module are left out. At runtime, a key that isn't a function
returns the key itself.

The adapter doesn't import Paraglide: any object of message functions works.

## Integrations

### NestJS

`I18nGatewayModule.register(options)` sets up nestjs-i18n with your options
and exports it, so `I18nService` can be injected wherever the module is
imported. Wrap the service in `NestI18nTranslatorAdapter` with a factory:

```ts
import { AcceptLanguageResolver, I18nService } from 'nestjs-i18n';
import {
  I18nGatewayModule,
  NestI18nTranslatorAdapter,
} from '@imcauan/translation/nestjs';
import type { I18nTranslations } from './generated/i18n';

@Module({
  imports: [
    I18nGatewayModule.register({
      fallbackLanguage: 'en',
      loaderOptions: { path: join(__dirname, 'i18n') },
      resolvers: [AcceptLanguageResolver],
    }),
  ],
  providers: [
    {
      provide: Translator,
      inject: [I18nService],
      useFactory: (i18n: I18nService<I18nTranslations>) =>
        new NestI18nTranslatorAdapter(i18n),
    },
  ],
  exports: [Translator],
})
export class TranslationModule {}
```

```ts
await translator.translate({
  key: 'errors.user.not_found', // typed from I18nTranslations
  args: { id },
  lang: 'pt-BR', // optional
});
```

Without `lang`, it uses the current request's language (from nestjs-i18n's
resolvers), and outside a request nestjs-i18n's fallback language.

## API

`@imcauan/translation`

- `ParaglideTranslatorAdapter(messages)`: `translate(key, ...params)` calls
  the message and returns its string.
- `MessageCatalog`: the shape the adapter accepts (`Record<string, unknown>`).
- `MessageKey<Catalog>`: the catalog's keys whose values are string-returning
  functions.
- `MessageParameters<Catalog, Key>`: a message's parameters.

`@imcauan/translation/nestjs`

- `I18nGatewayModule.register(options)`: `I18nModule.forRoot(options)`,
  imported and exported.
- `NestI18nTranslatorAdapter(i18nService)`: `translate({ key, args?, lang? })`
  returns a promise of the translated string.

## Design notes

- There's no shared translator interface: a Paraglide translator is
  synchronous with positional parameters, and a nestjs-i18n one is
  asynchronous with per-request languages. Define the interface your app
  needs and implement it with these adapters.

## License

MIT

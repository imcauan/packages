import { I18nContext, type I18nService, type Path } from 'nestjs-i18n';

/**
 * Translates with nestjs-i18n's `I18nService`. Without `lang`, it uses the
 * current request's language from `I18nContext`.
 *
 * `key` is a `Path<Translations>`, the dotted keys nestjs-i18n derives from
 * your generated translation types, so a typo is a compile error.
 */
export class NestI18nTranslatorAdapter<Translations extends object> {
  constructor(private readonly i18n: I18nService<Translations>) {}

  async translate<Key extends Path<Translations>>(params: {
    key: Key;
    args?: Record<string, unknown>;
    lang?: string;
  }): Promise<string> {
    return this.i18n.t<Key, string>(params.key, {
      args: params.args,
      lang: params.lang ?? I18nContext.current()?.lang,
    });
  }
}

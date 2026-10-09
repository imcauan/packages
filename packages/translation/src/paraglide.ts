// Generated Paraglide modules ship non-message exports too (e.g. a `m`
// runtime bridge) alongside message functions, so the catalog constraint
// stays permissive and `MessageKey` filters down to the function-valued,
// string-returning entries.
export type MessageCatalog = Record<string, unknown>;

export type MessageKey<Catalog extends MessageCatalog> = {
  [Key in keyof Catalog]: Catalog[Key] extends (
    ...args: never[]
  ) => infer Return
    ? Return extends string
      ? Key
      : never
    : never;
}[keyof Catalog] &
  string;

export type MessageParameters<
  Catalog extends MessageCatalog,
  Key extends MessageKey<Catalog>,
> = Catalog[Key] extends (...args: infer Params) => unknown ? Params : never;

/**
 * Generic translator adapter for a Paraglide-generated message catalog
 * (compile-time codegen: `messages[key](...params) => string`, sync).
 * Consumers pass their own generated `messages` module in; key and
 * parameter types are inferred from that catalog's shape.
 */
export class ParaglideTranslatorAdapter<Catalog extends MessageCatalog> {
  constructor(private readonly messages: Catalog) {}

  translate<Key extends MessageKey<Catalog>>(
    key: Key,
    ...params: MessageParameters<Catalog, Key>
  ): string {
    const message = this.messages[key];

    return typeof message === 'function' ? message(...params) : key;
  }
}

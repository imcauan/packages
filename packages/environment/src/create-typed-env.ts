import { v, type Infer, type Schema } from '@imcauan/validation';

export type CreateTypedEnvOptions<
  Client extends Record<string, Schema<unknown>>,
> = {
  /** Every key in `client` must start with this prefix. */
  clientPrefix: string;
  client: Client;
  runtimeEnv: Record<string, string | undefined>;
};

export type TypedEnv<Client extends Record<string, Schema<unknown>>> = {
  [K in keyof Client]: Infer<Client[K]>;
};

/**
 * Builds a typed, validated env object from a field -> schema map and the
 * matching raw runtime values. A small in-house replacement for
 * `@t3-oss/env-core`'s `createEnv` --- this repo only ever used its
 * `clientPrefix`/`client`/`runtimeEnv` slice, and `@imcauan/validation`
 * already gives the same validate-and-report-issues behavior every other
 * schema in the repo uses.
 */
export function createTypedEnv<Client extends Record<string, Schema<unknown>>>(
  options: CreateTypedEnvOptions<Client>,
): TypedEnv<Client> {
  const invalidKey = Object.keys(options.client).find(
    key => !key.startsWith(options.clientPrefix),
  );

  if (invalidKey) {
    throw new Error(
      `Invalid environment variable name: "${invalidKey}" does not start with "${options.clientPrefix}"`,
    );
  }

  return v.object(options.client).parse(options.runtimeEnv);
}

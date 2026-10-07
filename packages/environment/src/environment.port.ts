/**
 * Generic typed-environment port. Its shape is the same for every app
 * (`get({ env: K }): Schema[K]`); only the concrete `Schema` (field list,
 * secrets) belongs to the app.
 */
export interface IEnvironment<Schema extends Record<string, unknown>> {
  get<K extends keyof Schema>(params: { env: K }): Schema[K];
}

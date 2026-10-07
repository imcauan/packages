type StandardSchemaIssue = {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey>;
};

export type StandardSchemaResult<T> =
  | {
      readonly value: T;
      readonly issues?: undefined;
    }
  | {
      readonly issues: ReadonlyArray<StandardSchemaIssue>;
    };

export type StandardSchemaProps<Input, Output> = {
  readonly version: 1;
  readonly vendor: 'imcauan';
  readonly validate: (value: unknown) => StandardSchemaResult<Output>;
  readonly types?: {
    readonly input: Input;
    readonly output: Output;
  };
};

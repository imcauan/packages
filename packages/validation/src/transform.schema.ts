import { BaseSchema, InternalResult, Schema } from './schema';
import { ValidationPath } from './errors';

/**
 * Wraps a source schema and maps its validated value to another output type.
 */
export class TransformSchema<TInput, TOutput> extends BaseSchema<TOutput> {
  /**
   * Creates a transform schema that validates through `source` before mapping.
   */
  constructor(
    private readonly source: BaseSchema<TInput>,
    private readonly transformer: (value: TInput) => TOutput,
  ) {
    super();
  }

  /**
   * Validates input with the source schema and transforms successful output.
   */
  override parseInternal(
    input: unknown,
    path: ValidationPath,
  ): InternalResult<TOutput> {
    const result = this.source.parseInternal(input, path);
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: this.transformer(result.data),
    };
  }

  /**
   * Allows `undefined` without running the transformer.
   */
  override optional(): Schema<TOutput | undefined> {
    return super.optional();
  }

  /**
   * Uses a transformed-output default when input is `undefined`.
   */
  override default(
    value: Exclude<TOutput, undefined>,
  ): Schema<Exclude<TOutput, undefined>> {
    return super.default(value);
  }

  protected parseDefined(
    input: unknown,
    path: ValidationPath,
  ): InternalResult<TOutput> {
    return this.parseInternal(input, path);
  }

  protected clone(): TransformSchema<TInput, TOutput> {
    const schema = new TransformSchema(this.source, this.transformer);
    return this.copyBaseStateTo(schema);
  }
}

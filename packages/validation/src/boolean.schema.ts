import { BaseSchema, RequiredSchemaParams } from './schema';
import { ValidationPath } from './errors';

/**
 * Validates boolean input.
 */
export class BooleanSchema extends BaseSchema<boolean> {
  constructor(params: RequiredSchemaParams = {}) {
    super(params.requiredError);
  }

  protected parseDefined(input: unknown, path: ValidationPath) {
    if (typeof input !== 'boolean') {
      return this.fail(
        path,
        'invalid_type',
        this.requiredError ?? 'invalid_boolean',
      );
    }

    return {
      success: true as const,
      data: input,
    };
  }

  protected clone(): BooleanSchema {
    const schema = new BooleanSchema({
      requiredError: this.requiredError,
    });
    return this.copyBaseStateTo(schema);
  }
}

import { describe, expect, expectTypeOf, it } from 'vitest';

import { ValidationError, v, type Infer } from '../src';

const makeSut = (): typeof v => v;

describe('OneOfSchema', () => {
  it('should accept a value from a tuple of allowed values', () => {
    const sut = makeSut();

    const result = sut.oneOf(['any-a', 'any-b'] as const).validate('any-b');

    expect(result).toBe('any-b');
  });

  it('should accept a value from an object of allowed values', () => {
    const sut = makeSut();
    const values = { first: 'any-a', second: 'any-b' } as const;

    const result = sut.oneOf(values).validate('any-a');

    expect(result).toBe('any-a');
  });

  it('should fail with invalid_one_of when the value is not allowed', () => {
    const sut = makeSut();

    const result = sut.oneOf(['any-a', 'any-b'] as const).safeValidate('any-c');

    expect(result.issues).toEqual([
      { path: [], code: 'invalid_one_of', message: 'invalid_one_of' },
    ]);
  });

  it('should return a ValidationError when the value is not allowed', () => {
    const sut = makeSut();

    const result = sut.oneOf(['any-a', 'any-b'] as const).safeValidate('any-c');

    expect(result.error).toBeInstanceOf(ValidationError);
  });

  it('should use the required error for a missing value', () => {
    const sut = makeSut();
    const schema = sut.oneOf(['any-a'], { requiredError: 'any-required' });

    const result = schema.safeValidate(undefined);

    expect(result.issues).toEqual([
      { path: [], code: 'required', message: 'any-required' },
    ]);
  });

  it('should use the required error for a value that is not allowed', () => {
    const sut = makeSut();
    const schema = sut.oneOf(['any-a'], { requiredError: 'any-required' });

    const result = schema.safeValidate('any-c');

    expect(result.issues).toEqual([
      { path: [], code: 'invalid_one_of', message: 'any-required' },
    ]);
  });

  it('should infer a union of the allowed values', () => {
    const sut = makeSut();

    const schema = sut.oneOf(['any-a', 'any-b'] as const);

    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<'any-a' | 'any-b'>();
  });
});

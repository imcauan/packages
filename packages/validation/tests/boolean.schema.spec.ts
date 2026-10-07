import { v } from '../src';

const makeSut = (): typeof v => v;

describe('BooleanSchema', () => {
  it.each([true, false])('should return %s', value => {
    const sut = makeSut();

    const result = sut.boolean().validate(value);

    expect(result).toBe(value);
  });

  it('should fail with invalid_boolean when the value is not a boolean', () => {
    const sut = makeSut();

    const result = sut.boolean().safeValidate('true');

    expect(result.issues).toEqual([
      { path: [], code: 'invalid_type', message: 'invalid_boolean' },
    ]);
  });

  it('should fail with the required error when the value is missing', () => {
    const sut = makeSut();

    const result = sut
      .boolean({ requiredError: 'any-required' })
      .safeValidate(undefined);

    expect(result.issues).toEqual([
      { path: [], code: 'required', message: 'any-required' },
    ]);
  });

  it('should use the default when the value is missing', () => {
    const sut = makeSut();

    const result = sut.boolean().default(true).validate(undefined);

    expect(result).toBe(true);
  });
});

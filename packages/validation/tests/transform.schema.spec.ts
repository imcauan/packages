import { v, type Infer } from '../src';

const makeSut = (): typeof v => v;

describe('TransformSchema', () => {
  it('should return the transformed value', () => {
    const sut = makeSut();

    const result = sut
      .string()
      .transform(value => value.length)
      .validate('any-value');

    expect(result).toBe(9);
  });

  it('should infer the transformed output type', () => {
    const sut = makeSut();

    const schema = sut.string().transform(value => value.length);

    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<number>();
  });

  it('should validate with the source schema before transforming', () => {
    const sut = makeSut();
    const schema = sut
      .string()
      .min({ value: 3, error: 'any-error' })
      .transform(value => value.toUpperCase());

    const result = schema.safeValidate('ab');

    expect(result.issues).toEqual([
      { path: [], code: 'too_small', message: 'any-error' },
    ]);
  });

  it('should transform the source default when the value is missing', () => {
    const sut = makeSut();
    const schema = sut
      .string()
      .default('')
      .transform(value => value.length);

    const result = schema.validate(undefined);

    expect(result).toBe(0);
  });

  it('should use its own default when the value is missing', () => {
    const sut = makeSut();
    const schema = sut
      .string()
      .transform(value => value.length)
      .default(0);

    const result = schema.validate(undefined);

    expect(result).toBe(0);
  });

  it('should not run the transformer for a missing optional value', () => {
    const sut = makeSut();
    const transformer = vi.fn((value: string) => value.length);
    const schema = sut.string().transform(transformer).optional();

    schema.validate(undefined);

    expect(transformer).not.toHaveBeenCalled();
  });

  it('should keep nested paths from the source schema', () => {
    const sut = makeSut();
    const schema = sut.object({
      user: sut.object({
        name: sut
          .string({ requiredError: 'any-error' })
          .transform(value => value.trim()),
      }),
    });

    const result = schema.safeValidate({ user: { name: '' } });

    expect(result.issues).toEqual([
      { path: ['user', 'name'], code: 'required', message: 'any-error' },
    ]);
  });
});

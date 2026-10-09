import { v } from '@imcauan/validation';
import type { ResolverOptions } from 'react-hook-form';

import { validationResolver } from '../src';

const schema = v.object({
  name: v.string().min({ value: 3, error: 'name_too_short' }),
  email: v.string().email({ error: 'email_invalid' }),
});

type Values = { name: string; email: string };

const options: ResolverOptions<Values> = {
  fields: {},
  shouldUseNativeValidation: false,
};

const makeSut = () => validationResolver<Values>(schema);

describe('validationResolver', () => {
  it('should return the values and no errors when they are valid', async () => {
    const sut = makeSut();

    const result = await sut(
      { name: 'any-name', email: 'any@email.com' },
      undefined,
      options,
    );

    expect(result).toEqual({
      values: { name: 'any-name', email: 'any@email.com' },
      errors: {},
    });
  });

  it('should return an error per invalid field, with no values', async () => {
    const sut = makeSut();

    const result = await sut(
      { name: 'a', email: 'invalid-email' },
      undefined,
      options,
    );

    expect(result).toEqual({
      values: {},
      errors: {
        name: { type: 'too_small', message: 'name_too_short' },
        email: { type: 'invalid_string', message: 'email_invalid' },
      },
    });
  });
});

describe('validationResolver with nested fields', () => {
  const nestedSchema = v.object({
    address: v.object({
      city: v
        .string()
        .min({ value: 3, error: 'city_too_short' })
        .regex({ pattern: /^[A-Z]/, error: 'city_not_capitalized' }),
    }),
  });
  type Address = { address: { city: string } };
  const nestedOptions: ResolverOptions<Address> = {
    fields: {},
    shouldUseNativeValidation: false,
  };

  it('should nest the error under the field path', async () => {
    const sut = validationResolver<Address>(nestedSchema);

    const result = await sut(
      { address: { city: 'Ab' } },
      undefined,
      nestedOptions,
    );

    expect(result.errors).toEqual({
      address: { city: { type: 'too_small', message: 'city_too_short' } },
    });
  });

  it("should keep a field's first issue", async () => {
    const sut = validationResolver<Address>(nestedSchema);

    const result = await sut(
      { address: { city: 'a' } },
      undefined,
      nestedOptions,
    );

    expect(result.errors.address?.city?.message).toBe('city_too_short');
  });
});

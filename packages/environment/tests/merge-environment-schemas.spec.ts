import { ValidationError, v } from '@imcauan/validation';
import { describe, expect, it } from 'vitest';

import { mergeEnvironmentSchemas } from '../src';

type Environment = { PORT: number; NAME: string };

const PortSchema = v.object({ PORT: v.env.port(3000) });
const NameSchema = v.object({
  NAME: v.string({ requiredError: 'any-required' }),
});

const makeSut = (): ((input: unknown) => Environment) =>
  mergeEnvironmentSchemas<Environment>([PortSchema, NameSchema]);

describe('mergeEnvironmentSchemas', () => {
  it('should merge the output of every schema', () => {
    const sut = makeSut();

    const environment = sut({ NAME: 'any-name' });

    expect(environment).toEqual({ PORT: 3000, NAME: 'any-name' });
  });

  it('should throw a ValidationError when a schema fails', () => {
    const sut = makeSut();

    const validate = () => sut({});

    expect(validate).toThrow(ValidationError);
  });

  it('should report the issues of every failing schema together', () => {
    const sut = makeSut();

    const validate = () => sut({ PORT: 'invalid-port' });

    expect(validate).toThrow(
      expect.objectContaining({
        issues: [
          { path: ['PORT'], code: 'invalid_type', message: 'invalid_port' },
          { path: ['NAME'], code: 'required', message: 'any-required' },
        ],
      }),
    );
  });
});

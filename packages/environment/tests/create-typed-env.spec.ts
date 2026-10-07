import { v } from '@imcauan/validation';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { createTypedEnv } from '../src';

const makeSut = (): typeof createTypedEnv => createTypedEnv;

describe('createTypedEnv', () => {
  it('should return the validated values', () => {
    const sut = makeSut();

    const env = sut({
      clientPrefix: 'APP_',
      client: { APP_NAME: v.string(), APP_PORT: v.env.port(3000) },
      runtimeEnv: { APP_NAME: 'any-name', APP_PORT: '4000' },
    });

    expect(env).toEqual({ APP_NAME: 'any-name', APP_PORT: 4000 });
  });

  it('should type each key from its schema', () => {
    const sut = makeSut();

    const env = sut({
      clientPrefix: 'APP_',
      client: { APP_NAME: v.string(), APP_PORT: v.env.port(3000) },
      runtimeEnv: { APP_NAME: 'any-name' },
    });

    expectTypeOf(env).toEqualTypeOf<{ APP_NAME: string; APP_PORT: number }>();
  });

  it('should drop runtime values the schema does not declare', () => {
    const sut = makeSut();

    const env = sut({
      clientPrefix: 'APP_',
      client: { APP_NAME: v.string() },
      runtimeEnv: { APP_NAME: 'any-name', APP_SECRET: 'any-secret' },
    });

    expect(Object.hasOwn(env, 'APP_SECRET')).toBe(false);
  });

  it('should throw when a required value is missing', () => {
    const sut = makeSut();

    const create = () =>
      sut({
        clientPrefix: 'APP_',
        client: { APP_NAME: v.string({ requiredError: 'any-required' }) },
        runtimeEnv: {},
      });

    expect(create).toThrow('any-required');
  });

  it('should throw when a key does not start with the client prefix', () => {
    const sut = makeSut();

    const create = () =>
      sut({
        clientPrefix: 'APP_',
        client: { NAME: v.string() },
        runtimeEnv: { NAME: 'any-name' },
      });

    expect(create).toThrow(
      'Invalid environment variable name: "NAME" does not start with "APP_"',
    );
  });
});

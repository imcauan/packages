import { describe, expect, it } from 'vitest';

import { v } from '../src';

const makeSut = (): typeof v => v;

describe('Standard Schema', () => {
  it('should identify as version 1 from the imcauan vendor', () => {
    const sut = makeSut();

    const { version, vendor } = sut.string()['~standard'];

    expect({ version, vendor }).toEqual({ version: 1, vendor: 'imcauan' });
  });

  it('should return the value when it is valid', () => {
    const sut = makeSut();

    const result = sut.string()['~standard'].validate('any-value');

    expect(result).toEqual({ value: 'any-value' });
  });

  it('should return the issues with their paths when the value is invalid', () => {
    const sut = makeSut();
    const schema = sut.object({
      name: sut.string({ requiredError: 'any-error' }),
    });

    const result = schema['~standard'].validate({});

    expect(result).toEqual({
      issues: [{ message: 'any-error', path: ['name'] }],
    });
  });
});

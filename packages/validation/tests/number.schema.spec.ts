import { describe, expect, it } from 'vitest';

import { v } from '../src';

const makeSut = (): typeof v => v;

describe('NumberSchema', () => {
  describe('validate', () => {
    it('should return a valid number', () => {
      const sut = makeSut();

      const result = sut.number().validate(42);

      expect(result).toBe(42);
    });

    it('should fail with invalid_number when the value is not a number', () => {
      const sut = makeSut();

      const result = sut.number().safeValidate('42');

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_type', message: 'invalid_number' },
      ]);
    });

    it('should fail with the required error when the value is missing', () => {
      const sut = makeSut();

      const result = sut
        .number({ requiredError: 'any-required' })
        .safeValidate(undefined);

      expect(result.issues).toEqual([
        { path: [], code: 'required', message: 'any-required' },
      ]);
    });
  });

  describe('coerce', () => {
    it('should convert a numeric string to a number', () => {
      const sut = makeSut();

      const result = sut.number().coerce().validate('42');

      expect(result).toBe(42);
    });

    it('should fail with the coerce error when the value is not numeric', () => {
      const sut = makeSut();

      const result = sut
        .number()
        .coerce({ error: 'any-error' })
        .safeValidate('abc');

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_type', message: 'any-error' },
      ]);
    });

    it('should treat an empty string as missing', () => {
      const sut = makeSut();

      const result = sut.number().coerce().default(7).validate('');

      expect(result).toBe(7);
    });
  });

  describe('int', () => {
    it('should fail when the number is not an integer', () => {
      const sut = makeSut();

      const result = sut.number().int({ error: 'any-error' }).safeValidate(1.5);

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_integer', message: 'any-error' },
      ]);
    });
  });

  describe('min', () => {
    it('should fail when the number is below the minimum', () => {
      const sut = makeSut();

      const result = sut
        .number()
        .min({ value: 1, error: 'any-error' })
        .safeValidate(0);

      expect(result.issues).toEqual([
        { path: [], code: 'too_small', message: 'any-error' },
      ]);
    });
  });

  describe('max', () => {
    it('should fail when the number is above the maximum', () => {
      const sut = makeSut();

      const result = sut
        .number()
        .max({ value: 10, error: 'any-error' })
        .safeValidate(11);

      expect(result.issues).toEqual([
        { path: [], code: 'too_big', message: 'any-error' },
      ]);
    });
  });

  describe('default', () => {
    it('should use the default when the value is missing', () => {
      const sut = makeSut();

      const result = sut.number().default(3).validate(undefined);

      expect(result).toBe(3);
    });
  });
});

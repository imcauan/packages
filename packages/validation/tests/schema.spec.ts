import { describe, expect, it } from 'vitest';

import { ValidationError, v } from '../src';

const makeSut = (): typeof v => v;

describe('Schema', () => {
  describe('validate', () => {
    it('should throw a ValidationError when the value is invalid', () => {
      const sut = makeSut();
      const schema = sut.string({ requiredError: 'any-error' });

      const validate = () => schema.validate(undefined);

      expect(validate).toThrow(ValidationError);
    });
  });

  describe('safeValidate', () => {
    it('should return the data when the value is valid', () => {
      const sut = makeSut();

      const result = sut.string().safeValidate('any-value');

      expect(result).toEqual({ success: true, data: 'any-value' });
    });

    it('should return the issues and the error when the value is invalid', () => {
      const sut = makeSut();

      const result = sut
        .string({ requiredError: 'any-error' })
        .safeValidate(undefined);

      expect(result).toEqual({
        success: false,
        issues: [{ path: [], code: 'required', message: 'any-error' }],
        error: expect.any(ValidationError),
      });
    });
  });

  describe('parse', () => {
    it('should behave like validate', () => {
      const sut = makeSut();
      const schema = sut.string({ requiredError: 'any-error' });

      const parse = () => schema.parse(undefined);

      expect(parse).toThrow('any-error');
    });
  });

  describe('safeParse', () => {
    it('should behave like safeValidate', () => {
      const sut = makeSut();

      const result = sut.string().safeParse('any-value');

      expect(result).toEqual({ success: true, data: 'any-value' });
    });
  });

  describe('optional', () => {
    it('should accept a missing value', () => {
      const sut = makeSut();

      const result = sut.string().optional().validate(undefined);

      expect(result).toBeUndefined();
    });

    it('should still validate a value that is present', () => {
      const sut = makeSut();
      const schema = sut
        .string()
        .max({ value: 1, error: 'any-error' })
        .optional();

      const result = schema.safeValidate('any-value');

      expect(result.issues).toEqual([
        { path: [], code: 'too_big', message: 'any-error' },
      ]);
    });
  });
});

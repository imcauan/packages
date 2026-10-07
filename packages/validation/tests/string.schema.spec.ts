import { v } from '../src';

const makeSut = (): typeof v => v;

describe('StringSchema', () => {
  describe('validate', () => {
    it('should return a valid string', () => {
      const sut = makeSut();

      const result = sut.string().validate('any-value');

      expect(result).toBe('any-value');
    });

    it('should fail with the required error when the value is missing', () => {
      const sut = makeSut();

      const result = sut
        .string({ requiredError: 'any-required' })
        .safeValidate(undefined);

      expect(result.issues).toEqual([
        { path: [], code: 'required', message: 'any-required' },
      ]);
    });

    it('should treat an empty string as missing', () => {
      const sut = makeSut();

      const result = sut
        .string({ requiredError: 'any-required' })
        .safeValidate('');

      expect(result.issues).toEqual([
        { path: [], code: 'required', message: 'any-required' },
      ]);
    });

    it('should fail with invalid_string when the value is not a string', () => {
      const sut = makeSut();

      const result = sut.string().safeValidate(42);

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_type', message: 'invalid_string' },
      ]);
    });
  });

  describe('min', () => {
    it('should fail when the string is shorter than the minimum', () => {
      const sut = makeSut();

      const result = sut
        .string()
        .min({ value: 3, error: 'any-error' })
        .safeValidate('ab');

      expect(result.issues).toEqual([
        { path: [], code: 'too_small', message: 'any-error' },
      ]);
    });
  });

  describe('max', () => {
    it('should fail when the string is longer than the maximum', () => {
      const sut = makeSut();

      const result = sut
        .string()
        .max({ value: 3, error: 'any-error' })
        .safeValidate('abcd');

      expect(result.issues).toEqual([
        { path: [], code: 'too_big', message: 'any-error' },
      ]);
    });

    it('should accept a string at the maximum', () => {
      const sut = makeSut();

      const result = sut
        .string()
        .max({ value: 3, error: 'any-error' })
        .validate('abc');

      expect(result).toBe('abc');
    });
  });

  describe('regex', () => {
    it('should fail when the string does not match the pattern', () => {
      const sut = makeSut();

      const result = sut
        .string()
        .regex({ pattern: /^\d+$/, error: 'any-error' })
        .safeValidate('abc');

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_string', message: 'any-error' },
      ]);
    });
  });

  describe('email', () => {
    it('should accept an email address', () => {
      const sut = makeSut();

      const result = sut
        .string()
        .email({ error: 'any-error' })
        .validate('any@email.com');

      expect(result).toBe('any@email.com');
    });

    it('should fail when the value is not an email address', () => {
      const sut = makeSut();

      const result = sut
        .string()
        .email({ error: 'any-error' })
        .safeValidate('invalid-email');

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_string', message: 'any-error' },
      ]);
    });
  });

  describe('url', () => {
    it('should accept a URL', () => {
      const sut = makeSut();

      const result = sut
        .string()
        .url({ error: 'any-error' })
        .validate('https://any.url');

      expect(result).toBe('https://any.url');
    });

    it('should fail when the value is not a URL', () => {
      const sut = makeSut();

      const result = sut
        .string()
        .url({ error: 'any-error' })
        .safeValidate('invalid-url');

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_url', message: 'any-error' },
      ]);
    });
  });

  describe('default', () => {
    it('should use the default when the value is missing', () => {
      const sut = makeSut();

      const result = sut.string().default('any-default').validate(undefined);

      expect(result).toBe('any-default');
    });

    it('should use the default when the value is an empty string', () => {
      const sut = makeSut();

      const result = sut.string().default('any-default').validate('');

      expect(result).toBe('any-default');
    });
  });

  it('should not change the original schema when a rule is added', () => {
    const sut = makeSut();
    const schema = sut.string();
    schema.max({ value: 1, error: 'any-error' });

    const result = schema.validate('any-value');

    expect(result).toBe('any-value');
  });
});

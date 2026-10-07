import { v } from '../src';

const makeSut = (): typeof v => v;

describe('domain validators', () => {
  describe('email', () => {
    it('should accept an email address', () => {
      const sut = makeSut();

      const result = sut
        .email({ error: 'any-error' })
        .validate('any@email.com');

      expect(result).toBe('any@email.com');
    });

    it('should fail with its error when the value is not an email address', () => {
      const sut = makeSut();

      const result = sut
        .email({ error: 'any-error' })
        .safeValidate('invalid-email');

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_string', message: 'any-error' },
      ]);
    });

    it('should fail with the required error when the value is missing', () => {
      const sut = makeSut();
      const schema = sut.email({
        error: 'any-error',
        requiredError: 'any-required',
      });

      const result = schema.safeValidate(undefined);

      expect(result.issues).toEqual([
        { path: [], code: 'required', message: 'any-required' },
      ]);
    });
  });

  describe('url', () => {
    it('should fail with its error when the value is not a URL', () => {
      const sut = makeSut();

      const result = sut
        .url({ error: 'any-error' })
        .safeValidate('invalid-url');

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_url', message: 'any-error' },
      ]);
    });
  });

  describe('uuid', () => {
    it('should accept a UUID', () => {
      const sut = makeSut();

      const result = sut
        .uuid({ error: 'any-error' })
        .validate('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should fail with its error when the value is not a UUID', () => {
      const sut = makeSut();

      const result = sut
        .uuid({ error: 'any-error' })
        .safeValidate('invalid-uuid');

      expect(result.issues).toEqual([
        { path: [], code: 'invalid_string', message: 'any-error' },
      ]);
    });
  });

  describe('password', () => {
    it('should accept a password with lower and upper case, a digit and a symbol', () => {
      const sut = makeSut();

      const result = sut
        .password({ error: 'any-error' })
        .validate('@Password1');

      expect(result).toBe('@Password1');
    });

    it.each(['@password1', '@PASSWORD1', '@Password', 'Password1', '@Pass1'])(
      'should reject %s',
      password => {
        const sut = makeSut();

        const result = sut
          .password({ error: 'any-error' })
          .safeValidate(password);

        expect(result.issues).toEqual([
          { path: [], code: 'invalid_string', message: 'any-error' },
        ]);
      },
    );
  });
});

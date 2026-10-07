import { v } from '../src';

const makeSut = (): typeof v => v;

describe('ObjectSchema', () => {
  describe('validate', () => {
    it('should return the validated fields', () => {
      const sut = makeSut();
      const schema = sut.object({ name: sut.string(), active: sut.boolean() });

      const result = schema.validate({ name: 'any-name', active: true });

      expect(result).toEqual({ name: 'any-name', active: true });
    });

    it('should report an issue for every invalid field, with its path', () => {
      const sut = makeSut();
      const schema = sut.object({
        first: sut.string({ requiredError: 'any-first-error' }),
        second: sut.string({ requiredError: 'any-second-error' }),
      });

      const result = schema.safeValidate({});

      expect(result.issues).toEqual([
        { path: ['first'], code: 'required', message: 'any-first-error' },
        { path: ['second'], code: 'required', message: 'any-second-error' },
      ]);
    });

    it('should prefix nested issue paths with the parent key', () => {
      const sut = makeSut();
      const schema = sut.object({
        user: sut.object({ name: sut.string({ requiredError: 'any-error' }) }),
      });

      const result = schema.safeValidate({ user: {} });

      expect(result.issues).toEqual([
        { path: ['user', 'name'], code: 'required', message: 'any-error' },
      ]);
    });

    it.each([null, 'any-value', ['any-item']])(
      'should fail with invalid_object for %j',
      input => {
        const sut = makeSut();

        const result = sut.object({}).safeValidate(input);

        expect(result.issues).toEqual([
          { path: [], code: 'invalid_type', message: 'invalid_object' },
        ]);
      },
    );

    it('should drop keys the shape does not declare', () => {
      const sut = makeSut();
      const schema = sut.object({ declared: sut.string() });

      const result = schema.validate({
        declared: 'any-value',
        undeclared: 'any-other-value',
      });

      expect(Object.hasOwn(result, 'undeclared')).toBe(false);
    });

    it('should not change the input object', () => {
      const sut = makeSut();
      const schema = sut.object({ port: sut.number().coerce() });
      const input = { port: '3000' };

      schema.validate(input);

      expect(input).toEqual({ port: '3000' });
    });
  });

  describe('check', () => {
    it('should report issues added by a check, with the custom code by default', () => {
      const sut = makeSut();
      const schema = sut
        .object({ start: sut.number(), end: sut.number() })
        .check((values, ctx) => {
          if (values.end < values.start) {
            ctx.addIssue({ path: ['end'], message: 'any-error' });
          }
        });

      const result = schema.safeValidate({ start: 2, end: 1 });

      expect(result.issues).toEqual([
        { path: ['end'], code: 'custom', message: 'any-error' },
      ]);
    });

    it('should use the code given to addIssue', () => {
      const sut = makeSut();
      const schema = sut.object({}).check((_values, ctx) => {
        ctx.addIssue({ code: 'any-code', message: 'any-error' });
      });

      const result = schema.safeValidate({});

      expect(result.issues).toEqual([
        { path: [], code: 'any-code', message: 'any-error' },
      ]);
    });

    it('should not run checks when a field is invalid', () => {
      const sut = makeSut();
      let checked = false;
      const schema = sut.object({ name: sut.string() }).check(() => {
        checked = true;
      });

      schema.safeValidate({});

      expect(checked).toBe(false);
    });
  });

  describe('extend', () => {
    it('should validate the fields of both shapes', () => {
      const sut = makeSut();
      const schema = sut
        .object({ name: sut.string() })
        .extend({ age: sut.number() });

      const result = schema.validate({ name: 'any-name', age: 30 });

      expect(result).toEqual({ name: 'any-name', age: 30 });
    });
  });
});

import { v } from '../src';

const makeSut = (): typeof v => v;

describe('environment validators', () => {
  describe('port', () => {
    it('should convert a port string to a number', () => {
      const sut = makeSut();

      const result = sut.env.port(3000).validate('3333');

      expect(result).toBe(3333);
    });

    it('should use the default port when the value is missing', () => {
      const sut = makeSut();

      const result = sut.env.port(3000).validate(undefined);

      expect(result).toBe(3000);
    });

    it.each(['0', '65536', '80.5', 'any-value'])(
      'should reject %s with invalid_port',
      value => {
        const sut = makeSut();

        const result = sut.env.port().safeValidate(value);

        expect(result.issues?.[0]?.message).toBe('invalid_port');
      },
    );
  });

  describe('csv', () => {
    it('should split, trim and drop empty items', () => {
      const sut = makeSut();

      const result = sut.env.csv().validate('any-a, any-b,,');

      expect(result).toEqual(['any-a', 'any-b']);
    });

    it('should parse the default when the value is missing', () => {
      const sut = makeSut();

      const result = sut.env.csv('any-a,any-b').validate(undefined);

      expect(result).toEqual(['any-a', 'any-b']);
    });
  });
});

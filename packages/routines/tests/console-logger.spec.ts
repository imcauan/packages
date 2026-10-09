import { ConsoleLogger } from '../src';

const makeSut = (): ConsoleLogger => new ConsoleLogger('any-context');

describe('ConsoleLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('warn', () => {
    it('should call console.warn with the message prefixed by the context', () => {
      const sut = makeSut();
      const consoleWarn = vi.spyOn(console, 'warn').mockReturnValueOnce();

      sut.warn('any-message');

      expect(consoleWarn).toHaveBeenCalledWith('[any-context] any-message');
    });
  });

  describe('error', () => {
    it('should call console.error with the message prefixed by the context and the trace', () => {
      const sut = makeSut();
      const consoleError = vi.spyOn(console, 'error').mockReturnValueOnce();

      sut.error('any-message', 'any-trace');

      expect(consoleError).toHaveBeenCalledWith(
        '[any-context] any-message',
        'any-trace',
      );
    });

    it('should call console.error with an empty trace when none is given', () => {
      const sut = makeSut();
      const consoleError = vi.spyOn(console, 'error').mockReturnValueOnce();

      sut.error('any-message');

      expect(consoleError).toHaveBeenCalledWith(
        '[any-context] any-message',
        '',
      );
    });
  });
});

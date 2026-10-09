import { ParaglideTranslatorAdapter, type MessageKey } from '../src';

const messages = {
  greeting: (params: { name: string }) => `Hello, ${params.name}!`,
  farewell: () => 'Goodbye!',
  locale: 'en',
};

const makeSut = () => new ParaglideTranslatorAdapter(messages);

describe('ParaglideTranslatorAdapter', () => {
  describe('translate', () => {
    it('should call the message with its params', () => {
      const sut = makeSut();

      const result = sut.translate('greeting', { name: 'any-name' });

      expect(result).toBe('Hello, any-name!');
    });

    it('should call a message that takes no params', () => {
      const sut = makeSut();

      const result = sut.translate('farewell');

      expect(result).toBe('Goodbye!');
    });

    it('should return the key when it is not a message', () => {
      const sut = makeSut();

      const result = sut.translate(
        // @ts-expect-error: `locale` isn't a message, so the type rejects it
        'locale',
      );

      expect(result).toBe('locale');
    });
  });

  describe('MessageKey', () => {
    it('should keep only the keys of string-returning functions', () => {
      expectTypeOf<MessageKey<typeof messages>>().toEqualTypeOf<
        'greeting' | 'farewell'
      >();
    });
  });
});

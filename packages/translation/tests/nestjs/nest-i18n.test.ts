import 'reflect-metadata';

import { join } from 'node:path';

import { Test, type TestingModule } from '@nestjs/testing';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { I18nMessageFormat } from 'nestjs-i18n/dist/utils';

import { I18nGatewayModule, NestI18nTranslatorAdapter } from '../../src/nestjs';

const options = {
  fallbackLanguage: 'en',
  loaderOptions: {
    path: join(import.meta.dirname, '../fixtures/i18n'),
    watch: false,
  },
};

type Translations = {
  messages: { greeting: string; farewell: string };
};

describe('NestI18nTranslatorAdapter with I18nGatewayModule (NestJS)', () => {
  let moduleRef: TestingModule;
  let sut: NestI18nTranslatorAdapter<Translations>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [I18nGatewayModule.register(options)],
    }).compile();
    await moduleRef.init();
    sut = new NestI18nTranslatorAdapter(
      moduleRef.get<I18nService<Translations>>(I18nService),
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await moduleRef.close();
  });

  it('should translate into the given lang', async () => {
    const result = await sut.translate({
      key: 'messages.greeting',
      args: { name: 'any-name' },
      lang: 'pt-BR',
    });

    expect(result).toBe('Olá, any-name!');
  });

  it("should use the current request's lang when none is given", async () => {
    const i18n = moduleRef.get<I18nService<Translations>>(I18nService);
    vi.spyOn(I18nContext, 'current').mockReturnValueOnce(
      new I18nContext('pt-BR', i18n, new I18nMessageFormat(options)),
    );

    const result = await sut.translate({
      key: 'messages.greeting',
      args: { name: 'any-name' },
    });

    expect(result).toBe('Olá, any-name!');
  });

  it('should use the fallback language outside a request', async () => {
    const result = await sut.translate({ key: 'messages.farewell' });

    expect(result).toBe('Goodbye!');
  });

  it('should fall back to the fallback language for a missing key', async () => {
    const result = await sut.translate({
      key: 'messages.farewell',
      lang: 'pt-BR',
    });

    expect(result).toBe('Goodbye!');
  });
});

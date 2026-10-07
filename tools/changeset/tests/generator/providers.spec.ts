import { ChangesetStepError } from '../../src/errors.ts';
import {
  PROVIDERS,
  resolveProviderConfig,
} from '../../src/generator/providers.ts';

const gemini = PROVIDERS[0]!;

const makeSut = (): typeof resolveProviderConfig => resolveProviderConfig;

describe('resolveProviderConfig', () => {
  it('should use the provider defaults when no override is set', () => {
    const sut = makeSut();

    const config = sut(gemini, { CHANGESET_AI_API_KEY: 'any-key' });

    expect(config).toEqual({
      provider: gemini,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      model: 'gemini-3.8-flash',
      apiKey: 'any-key',
    });
  });

  it('should use the base URL and model from the environment', () => {
    const sut = makeSut();

    const config = sut(gemini, {
      CHANGESET_AI_API_KEY: 'any-key',
      CHANGESET_AI_BASE_URL: 'https://any.url/v1/',
      CHANGESET_AI_MODEL: 'any-model',
    });

    expect(config).toMatchObject({
      baseUrl: 'https://any.url/v1/',
      model: 'any-model',
    });
  });

  it('should throw when the API key is missing', () => {
    const sut = makeSut();

    const resolve = () => sut(gemini, {});

    expect(resolve).toThrow(ChangesetStepError);
  });
});

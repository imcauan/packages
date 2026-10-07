import { describe, expect, it, vi, type Mock } from 'vitest';

import {
  ChangesetStepError,
  InvalidModelResponseError,
} from '../../src/errors.ts';
import { OpenAiCompatibleGenerator } from '../../src/generator/openai-compatible.adapter.ts';
import {
  PROVIDERS,
  type ProviderConfig,
} from '../../src/generator/providers.ts';

const config: ProviderConfig = {
  provider: PROVIDERS[0]!,
  baseUrl: 'https://any.url/v1',
  model: 'any-model',
  apiKey: 'any-key',
};

const input = {
  changedPackages: ['@imcauan/logger'],
  commits: [],
  diff: 'any-diff',
};

const completion = (content: string) =>
  Response.json({ choices: [{ message: { role: 'assistant', content } }] });

type SutTypes = {
  sut: OpenAiCompatibleGenerator;
  fetchStub: Mock<typeof fetch>;
};

const makeSut = (): SutTypes => {
  const fetchStub = vi
    .fn<typeof fetch>()
    .mockResolvedValue(completion('{"any":"value"}'));
  const sut = new OpenAiCompatibleGenerator(config, fetchStub);
  return { sut, fetchStub };
};

describe('OpenAiCompatibleGenerator', () => {
  it('should post to the chat completions endpoint', async () => {
    const { sut, fetchStub } = makeSut();

    await sut.generate(input);

    const url = fetchStub.mock.calls[0]?.[0];
    expect(url instanceof URL ? url.href : url).toBe(
      'https://any.url/v1/chat/completions',
    );
  });

  it('should authenticate with the API key', async () => {
    const { sut, fetchStub } = makeSut();

    await sut.generate(input);

    expect(fetchStub.mock.calls[0]?.[1]?.headers).toMatchObject({
      authorization: 'Bearer any-key',
    });
  });

  it('should ask for JSON that follows the changeset schema', async () => {
    const { sut, fetchStub } = makeSut();

    await sut.generate(input);

    const body = fetchStub.mock.calls[0]?.[1]?.body;
    const parsed: unknown =
      typeof body === 'string' ? JSON.parse(body) : undefined;
    expect(parsed).toMatchObject({
      model: 'any-model',
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'changeset', strict: true },
      },
    });
  });

  it('should return the parsed message content', async () => {
    const { sut } = makeSut();

    const result = await sut.generate(input);

    expect(result).toEqual({ any: 'value' });
  });

  it('should throw InvalidModelResponseError when the content is not JSON', async () => {
    const { sut, fetchStub } = makeSut();
    fetchStub.mockResolvedValueOnce(completion('any-text'));

    const promise = sut.generate(input);

    await expect(promise).rejects.toThrow(InvalidModelResponseError);
  });

  it('should throw InvalidModelResponseError when there is no message', async () => {
    const { sut, fetchStub } = makeSut();
    fetchStub.mockResolvedValueOnce(Response.json({ choices: [] }));

    const promise = sut.generate(input);

    await expect(promise).rejects.toThrow(InvalidModelResponseError);
  });

  it('should report an unreachable endpoint', async () => {
    const { sut, fetchStub } = makeSut();
    fetchStub.mockRejectedValueOnce(new Error('any-message'));

    const promise = sut.generate(input);

    await expect(promise).rejects.toMatchObject({
      what: 'Could not reach Gemini',
      why: 'any-message',
    });
  });

  it('should report a rejected API key', async () => {
    const { sut, fetchStub } = makeSut();
    fetchStub.mockResolvedValueOnce(new Response('', { status: 401 }));

    const promise = sut.generate(input);

    await expect(promise).rejects.toMatchObject({
      what: 'Gemini rejected the API key',
    });
  });

  it('should report a quota or rate limit', async () => {
    const { sut, fetchStub } = makeSut();
    fetchStub.mockResolvedValueOnce(new Response('', { status: 429 }));

    const promise = sut.generate(input);

    await expect(promise).rejects.toThrow(ChangesetStepError);
    await expect(promise).rejects.toMatchObject({
      what: 'Gemini quota or rate limit reached',
    });
  });

  it('should report any other HTTP error', async () => {
    const { sut, fetchStub } = makeSut();
    fetchStub.mockResolvedValueOnce(new Response('', { status: 500 }));

    const promise = sut.generate(input);

    await expect(promise).rejects.toMatchObject({
      what: 'Gemini returned an error',
      why: 'HTTP 500.',
    });
  });
});

import { HttpStatusCode } from '../../src';
import { AxiosHttpClient, type AxiosHttpClientOptions } from '../../src/axios';
import {
  makeAxiosError,
  makeAxiosResponse,
  makeAxiosStub,
} from '../mocks/axios.stub';

const makeSut = (options: AxiosHttpClientOptions = {}) => {
  const { client, request } = makeAxiosStub();
  const sut = new AxiosHttpClient({ client, ...options });

  return { sut, request };
};

const apiError = (status: number, extra: Record<string, unknown> = {}) =>
  makeAxiosResponse({
    status,
    data: {
      data: null,
      statusCode: status,
      errors: ['any-error'],
      errorCode: 'any-code',
      ...extra,
    },
  });

describe('AxiosHttpClient', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('requests', () => {
    it.each([
      ['GET', (sut: AxiosHttpClient) => sut.get({ url: '/any-url' })],
      ['POST', (sut: AxiosHttpClient) => sut.post({ url: '/any-url' })],
      ['PUT', (sut: AxiosHttpClient) => sut.put({ url: '/any-url' })],
      ['PATCH', (sut: AxiosHttpClient) => sut.patch({ url: '/any-url' })],
      ['DELETE', (sut: AxiosHttpClient) => sut.delete({ url: '/any-url' })],
    ])('should return a successful %s response', async (_, send) => {
      const { sut, request } = makeSut();
      request.mockResolvedValueOnce(
        makeAxiosResponse({ status: 200, data: { ok: true } }),
      );

      const result = await send(sut);

      expect(result).toEqual({
        statusCode: 200,
        data: { ok: true },
        errors: null,
      });
    });

    it('should call axios.request with correct values', async () => {
      const { sut, request } = makeSut({ headers: { 'x-any': 'client' } });

      await sut.post({
        url: '/any-url',
        body: { name: 'any-name' },
        params: { page: 1 },
        headers: { 'x-other': 'request' },
      });

      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/any-url',
        data: { name: 'any-name' },
        params: { page: 1 },
        headers: { 'x-any': 'client', 'x-other': 'request' },
      });
    });

    it('should send credentials when the client enables them', async () => {
      const { sut, request } = makeSut({ withCredentials: true });

      await sut.get({ url: '/any-url' });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ withCredentials: true }),
      );
    });

    it('should send credentials when the request enables them', async () => {
      const { sut, request } = makeSut();

      await sut.get({ url: '/any-url', withCredentials: true });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ withCredentials: true }),
      );
    });
  });

  describe('errors', () => {
    it('should return an API error response as it is', async () => {
      const { sut, request } = makeSut();
      request.mockResolvedValueOnce(apiError(400, { _meta: { field: 'any' } }));

      const result = await sut.get({ url: '/any-url' });

      expect(result).toEqual({
        data: null,
        statusCode: 400,
        errors: ['any-error'],
        errorCode: 'any-code',
        _meta: { field: 'any' },
      });
    });

    it('should move a custom field to _meta', async () => {
      const { sut, request } = makeSut();
      request.mockResolvedValueOnce(apiError(401, { custom: { any: true } }));

      const result = await sut.get({ url: '/any-url' });

      expect(result).toMatchObject({ _meta: { any: true } });
    });

    it('should fill in an error with only `errors`', async () => {
      const { sut, request } = makeSut();
      request.mockResolvedValueOnce(
        makeAxiosResponse({ status: 401, data: { errors: ['any-error'] } }),
      );

      const result = await sut.post({ url: '/any-url' });

      expect(result).toEqual({
        data: null,
        statusCode: 401,
        errors: ['any-error'],
        errorCode: 'ERROR',
      });
    });

    it('should describe an error body that is not an API error', async () => {
      const { sut, request } = makeSut();
      request.mockResolvedValueOnce(
        makeAxiosResponse({ status: 404, data: 'any-html' }),
      );

      const result = await sut.get({ url: '/any-url' });

      expect(result).toEqual({
        data: null,
        statusCode: 404,
        errors: ['Request failed with status 404'],
        errorCode: 'ERROR',
      });
    });

    it('should return a thrown JSON API error as a response', async () => {
      const { sut, request } = makeSut();
      request.mockRejectedValueOnce(
        makeAxiosError({
          status: 409,
          data: { errors: ['any-error'], errorCode: 'any-code' },
          headers: { 'content-type': 'application/json' },
        }),
      );

      const result = await sut.post({ url: '/any-url' });

      expect(result).toEqual({
        data: null,
        statusCode: 409,
        errors: ['any-error'],
        errorCode: 'any-code',
      });
    });

    it('should return any other thrown error as a 500 response', async () => {
      const { sut, request } = makeSut();
      request.mockRejectedValueOnce(new Error('any-message'));

      const result = await sut.get({ url: '/any-url' });

      expect(result).toEqual({
        data: null,
        statusCode: 500,
        errorCode: 'ERROR',
        errors: ['any-message'],
      });
    });
  });

  describe('retries', () => {
    it('should retry a GET after network errors and 5xx', async () => {
      vi.useFakeTimers();
      const { sut, request } = makeSut();
      request
        .mockRejectedValueOnce(makeAxiosError())
        .mockRejectedValueOnce(makeAxiosError({ status: 503 }))
        .mockResolvedValueOnce(
          makeAxiosResponse({ status: 200, data: { ok: true } }),
        );

      const promise = sut.get({ url: '/any-url' });
      await vi.advanceTimersByTimeAsync(300 + 600);

      await expect(promise).resolves.toMatchObject({ statusCode: 200 });
    });

    it('should retry a GET answered with a retryable status', async () => {
      vi.useFakeTimers();
      const { sut, request } = makeSut();
      request.mockResolvedValueOnce(apiError(429));

      const promise = sut.get({ url: '/any-url' });
      await vi.advanceTimersByTimeAsync(300);
      await promise;

      expect(request).toHaveBeenCalledTimes(2);
    });

    it('should call hooks.onRetry with correct values', async () => {
      vi.useFakeTimers();
      const onRetry = vi.fn();
      const { sut, request } = makeSut({ hooks: { onRetry } });
      request.mockRejectedValueOnce(makeAxiosError({ status: 503 }));

      const promise = sut.get({ url: '/any-url' });
      await vi.advanceTimersByTimeAsync(300);
      await promise;

      expect(onRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: 1,
          nextAttempt: 2,
          delayMs: 300,
          statusCode: 503,
        }),
      );
    });

    it('should stop after the configured attempts', async () => {
      vi.useFakeTimers();
      const { sut, request } = makeSut();
      request.mockRejectedValue(makeAxiosError({ status: 503 }));

      const promise = sut.get({ url: '/any-url' });
      await vi.advanceTimersByTimeAsync(300 + 600);
      await promise;

      expect(request).toHaveBeenCalledTimes(3);
    });

    it('should not retry a POST by default', async () => {
      const { sut, request } = makeSut();
      request.mockRejectedValueOnce(makeAxiosError());

      await sut.post({ url: '/any-url' });

      expect(request).toHaveBeenCalledOnce();
    });

    it('should retry a POST when the request opts in', async () => {
      vi.useFakeTimers();
      const { sut, request } = makeSut();
      request.mockRejectedValueOnce(makeAxiosError({ status: 503 }));

      const promise = sut.post({
        url: '/any-url',
        retry: { attempts: 2, delayMs: 1, retryMethods: ['POST'] },
      });
      await vi.advanceTimersByTimeAsync(1);
      await promise;

      expect(request).toHaveBeenCalledTimes(2);
    });

    it('should wait the same delay each time with fixed backoff', async () => {
      vi.useFakeTimers();
      const onRetry = vi.fn();
      const { sut, request } = makeSut({
        hooks: { onRetry },
        retry: { backoff: 'fixed', delayMs: 100 },
      });
      request.mockRejectedValue(makeAxiosError({ status: 503 }));

      const promise = sut.get({ url: '/any-url' });
      await vi.advanceTimersByTimeAsync(200);
      await promise;

      expect(onRetry.mock.calls.map(([retry]) => retry.delayMs)).toEqual([
        100, 100,
      ]);
    });

    it('should cap the delay at maxDelayMs', async () => {
      vi.useFakeTimers();
      const onRetry = vi.fn();
      const { sut, request } = makeSut({
        hooks: { onRetry },
        retry: { delayMs: 100, maxDelayMs: 150 },
      });
      request.mockRejectedValue(makeAxiosError({ status: 503 }));

      const promise = sut.get({ url: '/any-url' });
      await vi.advanceTimersByTimeAsync(250);
      await promise;

      expect(onRetry.mock.calls.map(([retry]) => retry.delayMs)).toEqual([
        100, 150,
      ]);
    });
  });

  describe('hooks', () => {
    it('should send the headers resolveHeaders returns', async () => {
      const { sut, request } = makeSut({
        hooks: { resolveHeaders: () => ({ Authorization: 'any-token' }) },
      });

      await sut.get({ url: '/any-url' });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { Authorization: 'any-token' } }),
      );
    });

    it('should call onRequest with the resolved request', async () => {
      const onRequest = vi.fn();
      const { sut } = makeSut({
        hooks: {
          resolveHeaders: () => ({ Authorization: 'any-token' }),
          onRequest,
        },
      });

      await sut.get({ url: '/any-url' });

      expect(onRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/any-url',
          attempt: 1,
          headers: { Authorization: 'any-token' },
        }),
      );
    });

    it('should call onResponse with the response', async () => {
      const onResponse = vi.fn();
      const { sut } = makeSut({ hooks: { onResponse } });

      await sut.get({ url: '/any-url' });

      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 200 }),
      );
    });

    it('should call onError when the request throws', async () => {
      const onError = vi.fn();
      const { sut, request } = makeSut({ hooks: { onError } });
      request.mockRejectedValueOnce(makeAxiosError({ message: 'any-message' }));

      await sut.get({ url: '/any-url', retry: { attempts: 1 } });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 500,
            errors: ['any-message'],
          }),
        }),
      );
    });

    it('should send the request again once when onResponse asks for it', async () => {
      const resolveHeaders = vi
        .fn()
        .mockReturnValueOnce({ Authorization: 'expired-token' })
        .mockReturnValueOnce({ Authorization: 'fresh-token' });
      const { sut, request } = makeSut({
        hooks: {
          resolveHeaders,
          onResponse: vi.fn().mockReturnValueOnce({ action: 'retry' }),
        },
      });
      request.mockResolvedValueOnce(apiError(401));

      await sut.get({ url: '/any-url' });

      expect(request).toHaveBeenLastCalledWith(
        expect.objectContaining({ headers: { Authorization: 'fresh-token' } }),
      );
    });

    it('should send the request again only once when onResponse keeps asking', async () => {
      const { sut, request } = makeSut({
        hooks: { onResponse: () => ({ action: 'retry' }) },
      });
      request.mockResolvedValue(apiError(401));

      await sut.get({ url: '/any-url' });

      expect(request).toHaveBeenCalledTimes(2);
    });

    it('should send the request again once when onError asks for it', async () => {
      const { sut, request } = makeSut({
        hooks: { onError: () => ({ action: 'retry' }) },
      });
      request.mockRejectedValue(makeAxiosError());

      await sut.post({ url: '/any-url' });

      expect(request).toHaveBeenCalledTimes(2);
    });

    it('should not send the request again when it skips recovery', async () => {
      const { sut, request } = makeSut({
        hooks: { onResponse: () => ({ action: 'retry' }) },
      });
      request.mockResolvedValueOnce(apiError(401));

      await sut.post({ url: '/any-url', skipRecovery: true });

      expect(request).toHaveBeenCalledOnce();
    });
  });
});

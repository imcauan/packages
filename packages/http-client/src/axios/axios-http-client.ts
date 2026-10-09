import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import {
  ApiError,
  HttpClientHooks,
  HttpDeleteClient,
  HttpGetClient,
  HttpHookResult,
  HttpMethod,
  HttpPatchClient,
  HttpPostClient,
  HttpPutClient,
  HttpRequest,
  HttpRequestContext,
  HttpResponse,
  RetryOptions,
} from '..';

export type AxiosHttpClientOptions = {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  retry?: Partial<RetryOptions>;
  hooks?: HttpClientHooks;
  client?: AxiosInstance;
};

type RequestParams = {
  method: HttpMethod;
  request: HttpRequest;
  hasRecoveredError?: boolean;
};

type NormalizedError = {
  response: ApiError;
  rawResponseData?: unknown;
  statusCode?: number;
};

type RawApiError = Partial<ApiError> &
  Pick<ApiError, 'errors'> & {
    custom?: unknown;
  };

const defaultRetryOptions: RetryOptions = {
  attempts: 3,
  delayMs: 300,
  maxDelayMs: 3000,
  backoff: 'exponential',
  retryMethods: ['GET'],
  retryStatusCodes: [429, 500, 502, 503, 504],
};

export class AxiosHttpClient
  implements
    HttpPostClient,
    HttpGetClient,
    HttpPutClient,
    HttpPatchClient,
    HttpDeleteClient
{
  private readonly client: AxiosInstance;
  private readonly headers: Record<string, string>;
  private readonly withCredentials: boolean;
  private readonly retry: RetryOptions;
  private readonly hooks: HttpClientHooks;

  constructor(options: AxiosHttpClientOptions = {}) {
    this.client =
      options.client ??
      axios.create({
        baseURL: options.baseURL,
        timeout: options.timeout,
        headers: options.headers,
        validateStatus: () => true,
      });

    this.headers = options.headers ?? {};
    this.withCredentials = options.withCredentials ?? false;
    this.retry = this.mergeRetryOptions(defaultRetryOptions, options.retry);
    this.hooks = options.hooks ?? {};
  }

  async post<TBody, TResult>(
    params: HttpRequest<TBody>,
  ): Promise<HttpResponse<TResult>> {
    return this.request<TResult>({
      method: 'POST',
      request: params,
    });
  }

  async get<
    TResult,
    TParams extends Record<string, unknown> = Record<string, unknown>,
  >(params: HttpRequest<never, TParams>): Promise<HttpResponse<TResult>> {
    return this.request<TResult>({
      method: 'GET',
      request: params,
    });
  }

  async put<TBody, TResult>(
    params: HttpRequest<TBody>,
  ): Promise<HttpResponse<TResult>> {
    return this.request<TResult>({
      method: 'PUT',
      request: params,
    });
  }

  async patch<TBody, TResult>(
    params: HttpRequest<TBody>,
  ): Promise<HttpResponse<TResult>> {
    return this.request<TResult>({
      method: 'PATCH',
      request: params,
    });
  }

  async delete<
    TResult,
    TParams extends Record<string, unknown> = Record<string, unknown>,
  >(params: HttpRequest<never, TParams>): Promise<HttpResponse<TResult>> {
    return this.request<TResult>({
      method: 'DELETE',
      request: params,
    });
  }

  private async request<TResult>({
    method,
    request,
    hasRecoveredError = false,
  }: RequestParams): Promise<HttpResponse<TResult>> {
    const retry = this.mergeRetryOptions(this.retry, request.retry);

    for (let attempt = 1; attempt <= retry.attempts; attempt++) {
      const context = await this.buildRequestContext(method, request, attempt);

      try {
        await this.hooks.onRequest?.(context);
        const response = await this.client.request<TResult>(
          this.buildAxiosRequest(context),
        );
        const normalized = this.buildResponse<TResult>(response);

        if (
          this.shouldRetryResponse({
            method,
            response: normalized,
            retry,
            attempt,
          })
        ) {
          const delayMs = this.calculateRetryDelay(retry, attempt);

          await this.hooks.onRetry?.({
            request: context,
            attempt,
            nextAttempt: attempt + 1,
            delayMs,
            statusCode: normalized.statusCode,
            error: normalized,
          });

          await this.sleep(delayMs);
          continue;
        }

        const hookResult = await this.hooks.onResponse?.({
          request: context,
          statusCode: normalized.statusCode,
          data: normalized.data,
          response: normalized,
        });

        if (
          this.shouldRetryAfterHook({
            request,
            hasRecoveredError,
            hookResult,
          })
        ) {
          return this.request<TResult>({
            method,
            request,
            hasRecoveredError: true,
          });
        }

        return normalized;
      } catch (error) {
        const normalizedError = this.normalizeError(error);

        if (
          this.shouldRetry({ method, error, normalizedError, retry, attempt })
        ) {
          const delayMs = this.calculateRetryDelay(retry, attempt);

          await this.hooks.onRetry?.({
            request: context,
            attempt,
            nextAttempt: attempt + 1,
            delayMs,
            statusCode: normalizedError.statusCode,
            error,
          });

          await this.sleep(delayMs);
          continue;
        }

        const hookResult = await this.hooks.onError?.({
          request: context,
          response: normalizedError.response,
          error,
          rawResponseData: normalizedError.rawResponseData,
        });

        if (
          this.shouldRetryAfterHook({
            request,
            hasRecoveredError,
            hookResult,
          })
        ) {
          return this.request<TResult>({
            method,
            request,
            hasRecoveredError: true,
          });
        }

        return normalizedError.response;
      }
    }

    return {
      data: null,
      errorCode: 'ERROR',
      statusCode: 500,
      errors: ['Unexpected retry error'],
    };
  }

  private async buildRequestContext(
    method: HttpMethod,
    request: HttpRequest,
    attempt: number,
  ): Promise<HttpRequestContext> {
    const baseContext: HttpRequestContext = {
      method,
      url: request.url,
      body: request.body,
      params: request.params,
      attempt,
      skipRecovery: request.skipRecovery ?? false,
      withCredentials: request.withCredentials ?? this.withCredentials,
      headers: {
        ...this.headers,
        ...request.headers,
      },
    };

    const resolvedHeaders = await this.hooks.resolveHeaders?.(baseContext);

    return {
      ...baseContext,
      headers: {
        ...baseContext.headers,
        ...resolvedHeaders,
      },
    };
  }

  private buildAxiosRequest(context: HttpRequestContext): AxiosRequestConfig {
    return {
      method: context.method,
      url: context.url,
      data: context.body,
      params: context.params,
      headers: context.headers,
      ...(context.withCredentials ? { withCredentials: true } : {}),
    };
  }

  private buildResponse<TResult>(
    response: AxiosResponse<TResult>,
  ): HttpResponse<TResult> {
    if (response.status >= 400) {
      return this.buildErrorResponse(response);
    }

    return {
      statusCode: response.status,
      data: response.data,
      errors: null,
    };
  }

  private buildErrorResponse(response: AxiosResponse<unknown>): ApiError {
    const apiError = this.isApiError(response.data) ? response.data : undefined;

    return {
      data: null,
      statusCode: apiError?.statusCode ?? response.status,
      errorCode: apiError?.errorCode ?? 'ERROR',
      errors: apiError?.errors ?? [
        `Request failed with status ${response.status}`,
      ],
      _meta: apiError?._meta ?? apiError?.custom,
    };
  }

  private normalizeError(error: unknown): NormalizedError {
    if (error instanceof AxiosError) {
      const statusCode = error.response?.status ?? 500;
      const rawResponseData = this.isJsonResponse(error)
        ? error.response?.data
        : undefined;
      const apiError = this.isApiError(rawResponseData)
        ? rawResponseData
        : undefined;

      return {
        rawResponseData,
        statusCode,
        response: {
          data: null,
          statusCode: apiError?.statusCode ?? statusCode,
          errorCode: apiError?.errorCode ?? 'ERROR',
          errors: apiError?.errors ?? [error.message],
          _meta: apiError?._meta ?? apiError?.custom,
        },
      };
    }

    return {
      statusCode: 500,
      response: {
        data: null,
        errorCode: 'ERROR',
        statusCode: 500,
        errors: [error instanceof Error ? error.message : 'Unexpected error'],
      },
    };
  }

  private isJsonResponse(error: AxiosError): boolean {
    const contentType = error.response?.headers?.['content-type'];
    return (
      typeof contentType === 'string' &&
      contentType.includes('application/json')
    );
  }

  private isApiError(value: unknown): value is RawApiError {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return 'errors' in value && Array.isArray(value.errors);
  }

  private shouldRetry(params: {
    method: HttpMethod;
    error: unknown;
    normalizedError: NormalizedError;
    retry: RetryOptions;
    attempt: number;
  }): boolean {
    const { method, error, normalizedError, retry, attempt } = params;

    if (attempt >= retry.attempts || !retry.retryMethods.includes(method)) {
      return false;
    }

    if (!(error instanceof AxiosError)) {
      return false;
    }

    if (!error.response) {
      return true;
    }

    return retry.retryStatusCodes.includes(normalizedError.statusCode ?? 500);
  }

  private shouldRetryResponse(params: {
    method: HttpMethod;
    response: HttpResponse<unknown>;
    retry: RetryOptions;
    attempt: number;
  }): boolean {
    const { method, response, retry, attempt } = params;

    return (
      response.errors !== null &&
      attempt < retry.attempts &&
      retry.retryMethods.includes(method) &&
      retry.retryStatusCodes.includes(response.statusCode)
    );
  }

  private shouldRetryAfterHook(params: {
    request: HttpRequest;
    hasRecoveredError: boolean;
    hookResult: HttpHookResult | undefined;
  }): boolean {
    const { request, hasRecoveredError, hookResult } = params;

    return (
      hookResult?.action === 'retry' &&
      !request.skipRecovery &&
      !hasRecoveredError
    );
  }

  private calculateRetryDelay(retry: RetryOptions, attempt: number): number {
    const delay =
      retry.backoff === 'fixed'
        ? retry.delayMs
        : retry.delayMs * 2 ** (attempt - 1);

    return Math.min(delay, retry.maxDelayMs);
  }

  private sleep(delayMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  private mergeRetryOptions(
    base: RetryOptions,
    options?: Partial<RetryOptions>,
  ): RetryOptions {
    return {
      ...base,
      ...options,
      retryMethods: options?.retryMethods ?? base.retryMethods,
      retryStatusCodes: options?.retryStatusCodes ?? base.retryStatusCodes,
    };
  }
}

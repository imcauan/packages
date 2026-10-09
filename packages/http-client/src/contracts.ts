export const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode =
  (typeof HttpStatusCode)[keyof typeof HttpStatusCode];

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpRequest<TBody = unknown, TParams = Record<string, unknown>> = {
  url: string;
  body?: TBody;
  headers?: Record<string, string>;
  params?: TParams;
  retry?: Partial<RetryOptions>;
  skipRecovery?: boolean;
  withCredentials?: boolean;
};

export type ApiError<TCustom = unknown> = {
  statusCode: number;
  data: null;
  errors: string[];
  errorCode: string;
  _meta?: TCustom;
};

export type HttpResponse<TResult, TCustom = unknown> =
  | {
      statusCode: number;
      data: TResult;
      errors: null;
    }
  | ApiError<TCustom>;

export type RetryOptions = {
  attempts: number;
  delayMs: number;
  maxDelayMs: number;
  backoff: 'fixed' | 'exponential';
  retryMethods: HttpMethod[];
  retryStatusCodes: number[];
};

export type HttpRequestContext = {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  withCredentials: boolean;
  params?: unknown;
  body?: unknown;
  attempt: number;
  skipRecovery: boolean;
};

export type HttpResponseContext = {
  request: HttpRequestContext;
  statusCode: number;
  data: unknown;
  response: HttpResponse<unknown>;
};

export type HttpErrorContext = {
  request: HttpRequestContext;
  response: ApiError;
  error: unknown;
  rawResponseData?: unknown;
};

export type HttpRetryContext = {
  request: HttpRequestContext;
  attempt: number;
  nextAttempt: number;
  delayMs: number;
  statusCode?: number;
  error: unknown;
};

export type HttpHookResult = void | {
  action: 'retry';
};

export type HttpClientHooks = {
  onRequest?: (request: HttpRequestContext) => void | Promise<void>;
  onResponse?: (
    response: HttpResponseContext,
  ) => HttpHookResult | Promise<HttpHookResult>;
  onError?: (
    error: HttpErrorContext,
  ) => HttpHookResult | Promise<HttpHookResult>;
  onRetry?: (retry: HttpRetryContext) => void | Promise<void>;
  resolveHeaders?: (
    request: HttpRequestContext,
  ) => Record<string, string> | Promise<Record<string, string>>;
};

export interface HttpPostClient {
  post: <TBody, TResult>(
    params: HttpRequest<TBody>,
  ) => Promise<HttpResponse<TResult>>;
}

export const HttpPostClient = Symbol('HttpPostClient');

export interface HttpPutClient {
  put: <TBody, TResult>(
    params: HttpRequest<TBody>,
  ) => Promise<HttpResponse<TResult>>;
}

export const HttpPutClient = Symbol('HttpPutClient');

export interface HttpGetClient {
  get: <
    TResult,
    TParams extends Record<string, unknown> = Record<string, unknown>,
  >(
    params: HttpRequest<never, TParams>,
  ) => Promise<HttpResponse<TResult>>;
}

export const HttpGetClient = Symbol('HttpGetClient');

export interface HttpPatchClient {
  patch: <TBody, TResult>(
    params: HttpRequest<TBody>,
  ) => Promise<HttpResponse<TResult>>;
}

export const HttpPatchClient = Symbol('HttpPatchClient');

export interface HttpDeleteClient {
  delete: <
    TResult,
    TParams extends Record<string, unknown> = Record<string, unknown>,
  >(
    params: HttpRequest<never, TParams>,
  ) => Promise<HttpResponse<TResult>>;
}

export const HttpDeleteClient = Symbol('HttpDeleteClient');

import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
} from 'axios';
import type { MockInstance } from 'vitest';

type AxiosStub = {
  client: AxiosInstance;
  request: MockInstance<AxiosInstance['request']>;
};

/** A real axios instance whose `request` is a spy that answers 200. */
export const makeAxiosStub = (): AxiosStub => {
  const client: AxiosInstance = axios.create();
  const request = vi
    .spyOn(client, 'request')
    .mockResolvedValue(makeAxiosResponse({ status: 200, data: undefined }));

  return { client, request };
};

export const makeAxiosResponse = <T>(params: {
  status: number;
  data: T;
  headers?: Record<string, string>;
}): AxiosResponse<T> => ({
  status: params.status,
  statusText: '',
  data: params.data,
  headers: params.headers ?? {},
  config: { headers: new AxiosHeaders() },
});

/** An axios transport error; with `status`, the server answered. */
export const makeAxiosError = (
  params: {
    message?: string;
    status?: number;
    data?: unknown;
    headers?: Record<string, string>;
  } = {},
): AxiosError =>
  new AxiosError(
    params.message ?? 'any-message',
    undefined,
    undefined,
    undefined,
    params.status === undefined
      ? undefined
      : makeAxiosResponse({
          status: params.status,
          data: params.data,
          headers: params.headers,
        }),
  );

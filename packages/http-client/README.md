# @imcauan/http-client

HTTP client ports that return normalized responses instead of throwing, with
retries and lifecycle hooks, and an adapter built on
[axios](https://axios-http.com).

## Install

```bash
pnpm add @imcauan/http-client
```

The core has no dependencies. For the axios adapter
(`@imcauan/http-client/axios`):

```bash
pnpm add axios
```

| Peer    | Range     | Needed for |
| ------- | --------- | ---------- |
| `axios` | `^1.20.0` | `/axios`   |

It's an optional peer. See the [root README](../../README.md#install) to set
up the GitHub Packages registry.

## Usage

Code that calls an API depends on the port for the method it uses, so it
doesn't know which HTTP library sends the request:

```ts
import { HttpStatusCode, type HttpGetClient } from '@imcauan/http-client';

export class LoadProfile {
  constructor(private readonly http: HttpGetClient) {}

  async execute() {
    const response = await this.http.get<{ name: string }>({ url: '/me' });

    if (response.errors) {
      // { statusCode, errors, errorCode, _meta? }
      throw new Error(response.errors.join(', '));
    }

    return response.data; // { name: string }
  }
}
```

Every call resolves to an `HttpResponse`: on success
`{ statusCode, data, errors: null }`, on failure an `ApiError`
(`{ statusCode, data: null, errors, errorCode, _meta? }`). HTTP errors,
network failures and timeouts are returned, never thrown. Check `errors` to
narrow the type.

There's one port per method (`HttpGetClient`, `HttpPostClient`,
`HttpPutClient`, `HttpPatchClient`, `HttpDeleteClient`), each with a token of
the same name for DI containers that bind interfaces to tokens.

## Integrations

### axios

`AxiosHttpClient` implements all five ports:

```ts
import { AxiosHttpClient } from '@imcauan/http-client/axios';

const http = new AxiosHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
  hooks: {
    resolveHeaders: async () => ({
      Authorization: `Bearer ${await session.token()}`,
    }),
  },
});
```

Options: `baseURL`, `timeout`, `headers`, `withCredentials`, `retry`,
`hooks`, or `client` to use an axios instance you configured yourself.

**Error bodies.** When an error response body has an `errors` array, its
`statusCode`, `errorCode` and `_meta` are kept (a `custom` field is moved to
`_meta`). Any other body becomes `errors: ['Request failed with status
<code>']` and `errorCode: 'ERROR'`.

**Retries.** By default, `GET` requests are retried up to 3 attempts after a
network error, a timeout, or a `429`, `500`, `502`, `503` or `504`, waiting
300 ms and then doubling, up to 3 s. Other methods aren't retried unless you
opt in, for the client or per request:

```ts
await http.post({
  url: '/payments',
  body,
  retry: { attempts: 2, retryMethods: ['POST'] },
});
```

**Hooks.**

| Hook             | Called                                      | Returns                                |
| ---------------- | ------------------------------------------- | -------------------------------------- |
| `resolveHeaders` | Before each attempt                         | Headers to add                         |
| `onRequest`      | Before each attempt, with the final request |                                        |
| `onResponse`     | After a response                            | `{ action: 'retry' }` to send it again |
| `onError`        | After a thrown error that isn't retried     | `{ action: 'retry' }` to send it again |
| `onRetry`        | Before waiting for a retry                  |                                        |

`{ action: 'retry' }` sends the request once more, with headers resolved
again: for example, after refreshing an expired token on a `401`. It happens
at most once per call, and never for a request with `skipRecovery: true`
(such as the refresh request itself).

## API

`@imcauan/http-client`

- `HttpGetClient`, `HttpPostClient`, `HttpPutClient`, `HttpPatchClient`,
  `HttpDeleteClient`: one port and one token per method.
- `HttpRequest`: `{ url, body?, params?, headers?, retry?, skipRecovery?,
withCredentials? }`.
- `HttpResponse<T>`, `ApiError`: the normalized results.
- `HttpStatusCode`: common status codes by name.
- `HttpMethod`, `RetryOptions`, `HttpClientHooks`, `HttpRequestContext`,
  `HttpResponseContext`, `HttpErrorContext`, `HttpRetryContext`,
  `HttpHookResult`: option and hook types.

`@imcauan/http-client/axios`

- `AxiosHttpClient(options?)`: implements the five ports with axios.
- `AxiosHttpClientOptions`: its options.

## Design notes

- Results are values, not exceptions, so callers handle failures where they
  call, with types.
- Without a `client`, the adapter's axios instance accepts every status
  (`validateStatus: () => true`) and normalizes errors itself.

## License

MIT

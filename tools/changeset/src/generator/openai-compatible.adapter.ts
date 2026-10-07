import { ChangesetStepError, InvalidModelResponseError } from '../errors.ts';
import type {
  ChangesetGenerator,
  GenerateChangesetInput,
} from './changeset-generator.port.ts';
import { buildMessages, DRAFT_JSON_SCHEMA } from './prompt.ts';
import type { ProviderConfig } from './providers.ts';

type Fetch = typeof fetch;

const REQUEST_TIMEOUT_MS = 60_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Reads `choices[0].message.content` from a chat completion. */
function readMessageContent(body: unknown): string | undefined {
  if (!isRecord(body) || !Array.isArray(body.choices)) return undefined;
  const [choice]: unknown[] = body.choices;
  if (!isRecord(choice) || !isRecord(choice.message)) return undefined;
  const { content } = choice.message;
  return typeof content === 'string' ? content : undefined;
}

function describeHttpFailure(
  status: number,
  label: string,
): { what: string; why: string } {
  if (status === 401 || status === 403) {
    return {
      what: `${label} rejected the API key`,
      why: `HTTP ${status}. Check CHANGESET_AI_API_KEY.`,
    };
  }
  if (status === 429) {
    return {
      what: `${label} quota or rate limit reached`,
      why: 'HTTP 429. Wait a moment, or check your plan.',
    };
  }
  return {
    what: `${label} returned an error`,
    why: `HTTP ${status}.`,
  };
}

/**
 * Drafts changesets through any OpenAI-compatible chat completions endpoint
 * (Gemini, Groq, OpenRouter, a local server...), asking for structured JSON.
 */
export class OpenAiCompatibleGenerator implements ChangesetGenerator {
  private readonly config: ProviderConfig;
  private readonly fetch: Fetch;

  constructor(config: ProviderConfig, fetchImplementation: Fetch = fetch) {
    this.config = config;
    this.fetch = fetchImplementation;
  }

  async generate(input: GenerateChangesetInput): Promise<unknown> {
    const { provider, baseUrl, model, apiKey } = this.config;
    const url = new URL(
      'chat/completions',
      baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
    );

    let response: Response;
    try {
      response = await this.fetch(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: buildMessages(input),
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'changeset',
              strict: true,
              schema: DRAFT_JSON_SCHEMA,
            },
          },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new ChangesetStepError({
        what: `Could not reach ${provider.label}`,
        why: error instanceof Error ? error.message : String(error),
        cause: error,
      });
    }

    if (!response.ok) {
      throw new ChangesetStepError(
        describeHttpFailure(response.status, provider.label),
      );
    }

    const content = readMessageContent(
      await response.json().catch(() => undefined),
    );

    if (content === undefined) {
      throw new InvalidModelResponseError([
        'the response has no message content',
      ]);
    }

    try {
      const parsed: unknown = JSON.parse(content);
      return parsed;
    } catch {
      throw new InvalidModelResponseError([
        'the message content is not valid JSON',
      ]);
    }
  }
}

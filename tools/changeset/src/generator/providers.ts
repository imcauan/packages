import { ChangesetStepError } from '../errors.ts';

/** A model provider reachable through an OpenAI-compatible endpoint. */
export type ProviderDefinition = {
  id: string;
  label: string;
  defaultBaseUrl: string;
  defaultModel: string;
};

export const PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: 'gemini',
    label: 'Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-3.8-flash',
  },
];

export type ProviderConfig = {
  provider: ProviderDefinition;
  baseUrl: string;
  model: string;
  apiKey: string;
};

type Environment = Readonly<Record<string, string | undefined>>;

/** Applies the CHANGESET_AI_* variables on top of the provider's defaults. */
export function resolveProviderConfig(
  provider: ProviderDefinition,
  env: Environment,
): ProviderConfig {
  const apiKey = env.CHANGESET_AI_API_KEY;

  if (!apiKey) {
    throw new ChangesetStepError({
      what: 'No API key for the model',
      why: 'CHANGESET_AI_API_KEY is not set.',
    });
  }

  return {
    provider,
    baseUrl: env.CHANGESET_AI_BASE_URL || provider.defaultBaseUrl,
    model: env.CHANGESET_AI_MODEL || provider.defaultModel,
    apiKey,
  };
}

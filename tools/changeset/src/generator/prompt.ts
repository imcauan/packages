import {
  BUMPS,
  type GenerateChangesetInput,
} from './changeset-generator.port.ts';

/** JSON Schema the model's answer must follow. */
export const DRAFT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    releases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          bump: { type: 'string', enum: [...BUMPS] },
        },
        required: ['name', 'bump'],
        additionalProperties: false,
      },
    },
    summary: { type: 'string' },
  },
  required: ['releases', 'summary'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You write changesets for a monorepo of TypeScript packages published as @imcauan/*.
A changeset lists the packages a change releases, a semver bump for each, and one summary for the changelog.

All packages are on 0.x, where semver shifts down one level:
- patch: bug fixes, docs, internal refactors, additions that don't change existing behavior.
- minor: anything that may break a consumer: removed or renamed exports, changed signatures or defaults, raised peer dependency ranges.
- major: declares the API stable (1.0). Never use it unless the diff explicitly does that.
When unsure between patch and minor, choose minor.

Rules:
- List only packages from the "Changed packages" list, by their exact name.
- The summary is for people reading the changelog: what changed for them, and how to migrate if it breaks something. Start with a verb (Add, Fix, Rename, Remove). One short paragraph, Markdown allowed, no headings.
- Answer with JSON only, following the given schema.`;

export type ChatMessage = { role: 'system' | 'user'; content: string };

export function buildMessages(input: GenerateChangesetInput): ChatMessage[] {
  const user = [
    '## Changed packages',
    ...input.changedPackages.map(name => `- ${name}`),
    '',
    '## Commits',
    ...(input.commits.length > 0
      ? input.commits.map(subject => `- ${subject}`)
      : ['(none)']),
    '',
    '## Diff',
    '```diff',
    input.diff,
    '```',
  ].join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ];
}

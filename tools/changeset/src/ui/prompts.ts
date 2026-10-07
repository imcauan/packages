import { confirm, isCancel, select } from '@clack/prompts';

import { ChangesetStepError } from '../errors.ts';
import type { ProviderDefinition } from '../generator/providers.ts';
import type { Terminal } from './terminal.ts';

/** Asks which provider drafts the changeset. */
export async function selectProvider(
  terminal: Terminal,
  providers: readonly ProviderDefinition[],
): Promise<ProviderDefinition> {
  const choice = await select({
    message: 'Which model should draft the changeset?',
    options: providers.map(provider => ({
      value: provider.id,
      label: provider.label,
      hint: provider.defaultModel,
    })),
    input: terminal.input,
    output: terminal.output,
  });

  const provider = providers.find(candidate => candidate.id === choice);
  if (isCancel(choice) || !provider) {
    throw new ChangesetStepError({
      what: 'Cancelled',
      why: 'No model was chosen.',
    });
  }
  return provider;
}

/** Asks before writing a changeset that bumps a package to 1.0. */
export async function confirmMajor(
  terminal: Terminal,
  packages: readonly string[],
): Promise<boolean> {
  const answer = await confirm({
    message: `The draft bumps ${packages.join(', ')} to a major version (1.0, declaring the API stable). Keep it?`,
    initialValue: false,
    input: terminal.input,
    output: terminal.output,
  });
  return answer === true;
}

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { OpenAiCompatibleGenerator } from './generator/openai-compatible.adapter.ts';
import { PROVIDERS } from './generator/providers.ts';
import { Git, parsePushRefs } from './git.ts';
import { run, type Prompts } from './run.ts';
import { confirmMajor, selectProvider } from './ui/prompts.ts';
import { Reporter } from './ui/reporter.ts';
import { openTerminal } from './ui/terminal.ts';
import { createTheme, supportsColor } from './ui/theme.ts';
import { renderChangeset, writeDraft } from './write.ts';
import { Workspace } from './workspace.ts';

const USAGE = `Usage: changeset [remote] [url] [options]

Drafts a changeset with an AI model when the branch changes a published
package without one. Run by the pre-push hook, which passes the remote and
pipes the pushed refs on stdin.

Options:
  --model <id>   Provider to use, skipping the picker (${PROVIDERS.map(provider => provider.id).join(', ')})
  --yes          Accept a major bump without asking
  --dry-run      Print the changeset without writing or committing it
  --debug        Show stack traces for unexpected errors
  --help         Show this help

Environment: CHANGESET_AI_API_KEY (required), CHANGESET_AI_BASE_URL,
CHANGESET_AI_MODEL, SKIP_CHANGESET=1 (skip the step).`;

function readStdin(): string {
  if (process.stdin.isTTY) return '';
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      model: { type: 'string' },
      yes: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      debug: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  // Run from any directory (pnpm runs scripts from the package's): git
  // pathspecs and the .changeset folder are relative to the repository root.
  const cwd = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  }).trim();

  // CHANGESET_AI_* can live in the repository's git-ignored .env. Variables
  // already set in the shell take precedence.
  if (existsSync(path.join(cwd, '.env'))) {
    process.loadEnvFile(path.join(cwd, '.env'));
  }
  const [remote] = positionals;
  const terminal = openTerminal();
  const output = terminal?.output ?? process.stderr;
  const theme = createTheme({ color: supportsColor(output, process.env) });

  const prompts: Prompts | undefined = terminal && {
    selectProvider: providers => selectProvider(terminal, providers),
    confirmMajor: packages => confirmMajor(terminal, packages),
  };

  try {
    return await run(
      {
        git: new Git(cwd),
        workspace: new Workspace(cwd),
        reporter: new Reporter({ output, theme }),
        theme,
        prompts,
        providers: PROVIDERS,
        createGenerator: config => new OpenAiCompatibleGenerator(config),
        writeDraft: draft => writeDraft(cwd, draft),
        renderChangeset,
        env: process.env,
      },
      {
        model: values.model,
        yes: values.yes,
        dryRun: values['dry-run'],
        debug: values.debug,
        remote,
        pushRefs: remote === undefined ? [] : parsePushRefs(readStdin()),
      },
    );
  } finally {
    terminal?.close();
  }
}

main().then(
  code => {
    process.exitCode = code;
  },
  (error: unknown) => {
    // Invalid flags end up here, before the reporter exists.
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n\n${USAGE}\n`,
    );
    process.exitCode = 1;
  },
);

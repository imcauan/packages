# @tools/changeset

Private tool, never published. The pre-push hook runs it to draft a changeset
with an AI model when a branch changes a published package without one.

How it behaves, how to set it up, and its flags:
[docs/CHANGESET.md](../../docs/CHANGESET.md#automated-pre-push-step). Why
providers are adapters: [ADR 0006](../../docs/adr/0006-changeset-generator-port.md).

## Layout

```
src/
├── cli.ts                  # entry: flags, stdin refs, wiring
├── run.ts                  # the step, with every dependency injected
├── errors.ts               # what failed, why, what to do next
├── git.ts                  # git operations and pre-push ref parsing
├── workspace.ts            # workspace packages, changed published packages
├── validate.ts             # checks the model's answer
├── write.ts                # writes and renders the changeset file
├── generator/
│   ├── changeset-generator.port.ts
│   ├── openai-compatible.adapter.ts
│   ├── providers.ts        # provider registry and env overrides
│   └── prompt.ts           # system prompt and JSON schema
└── ui/                     # terminal UI, kept apart for reuse by the create CLI
    ├── theme.ts            # colors; respects NO_COLOR
    ├── reporter.ts         # the clack-style rail, steps, spinner, errors
    ├── changeset-box.ts
    ├── prompts.ts          # @clack/prompts through /dev/tty
    ├── terminal.ts
    └── text.ts
```

## Development

```bash
pnpm --filter @tools/changeset test
pnpm --filter @tools/changeset start --dry-run   # needs CHANGESET_AI_API_KEY
```

It runs from TypeScript source (Node's type stripping), so there's no build
step. Keep to erasable syntax and import files with their `.ts` extension.

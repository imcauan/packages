# ADR 0006: Changeset providers behind a port

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The pre-push changeset step asks an AI model to draft a changeset. Gemini is
the only provider for now, but Groq or Claude may be added later, and models
change faster than the rest of the step. The rest of the step (reading the
diff, validating the answer, writing the file, committing, pushing again) is
the same whatever model answers, and must be testable without network calls.

## Decision

- A `ChangesetGenerator` port, `generate(input): Promise<unknown>`, in
  `tools/changeset/src/generator/changeset-generator.port.ts`. It returns the
  model's raw answer; validation is not the adapter's job.
- One adapter, `OpenAiCompatibleGenerator`, calls any OpenAI-compatible chat
  completions endpoint and asks for JSON that follows a schema. Gemini is
  reached through it.
- A provider registry lists each provider's id, label, default base URL and
  default model. `CHANGESET_AI_BASE_URL`, `CHANGESET_AI_MODEL` and
  `CHANGESET_AI_API_KEY` override them.
- The orchestrator (`run.ts`) receives the generator, git, workspace,
  prompts and reporter as dependencies. Diff reading, validation, writing and
  git are separate modules.

## Consequences

- A provider with an OpenAI-compatible endpoint is one registry entry; one
  without is one adapter. Nothing else changes.
- The orchestrator is unit-tested with the provider mocked; git operations
  are tested against a temporary repository.
- Every answer is validated against the workspace (packages exist and are
  published, bumps are valid), whichever provider produced it.
- The tool runs from TypeScript source with Node's type stripping, so it
  avoids TypeScript-only syntax (enums, parameter properties) and imports
  files with their `.ts` extension.

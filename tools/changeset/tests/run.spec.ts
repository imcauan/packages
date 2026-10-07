import type { Mock, Mocked } from 'vitest';

import {
  ChangesetStepError,
  InvalidModelResponseError,
} from '../src/errors.ts';
import type {
  ChangesetGenerator,
  DraftChangeset,
} from '../src/generator/changeset-generator.port.ts';
import { PROVIDERS, type ProviderConfig } from '../src/generator/providers.ts';
import type { PushRef } from '../src/git.ts';
import {
  MAX_DIFF_CHARACTERS,
  run,
  type Prompts,
  type RunOptions,
} from '../src/run.ts';
import { Reporter } from '../src/ui/reporter.ts';
import { createTheme } from '../src/ui/theme.ts';
import { renderChangeset } from '../src/write.ts';
import { makeChangesetGeneratorStub } from './mocks/changeset-generator.stub.ts';
import { makeGitStub, type GitStub } from './mocks/git.stub.ts';
import { MemoryOutput } from './mocks/memory-output.ts';
import { makePromptsStub } from './mocks/prompts.stub.ts';
import {
  makeWorkspaceStub,
  type WorkspaceStub,
} from './mocks/workspace.stub.ts';

const pushRef: PushRef = {
  localRef: 'refs/heads/feat/any-branch',
  localSha: 'a'.repeat(40),
  remoteRef: 'refs/heads/feat/any-branch',
  remoteSha: 'b'.repeat(40),
};

type SutTypes = {
  sut: (options?: Partial<RunOptions>) => Promise<0 | 1>;
  gitStub: GitStub;
  workspaceStub: WorkspaceStub;
  generatorStub: Mocked<ChangesetGenerator>;
  createGeneratorSpy: Mock<(config: ProviderConfig) => ChangesetGenerator>;
  writeDraftSpy: Mock<(draft: DraftChangeset) => Promise<string>>;
  promptsStub: Mocked<Prompts>;
  output: MemoryOutput;
};

type MakeSutOptions = {
  env?: Record<string, string | undefined>;
  withTerminal?: boolean;
  providers?: typeof PROVIDERS;
};

const makeSut = ({
  env = { CHANGESET_AI_API_KEY: 'any-key' },
  withTerminal = true,
  providers = PROVIDERS,
}: MakeSutOptions = {}): SutTypes => {
  const gitStub = makeGitStub();
  const workspaceStub = makeWorkspaceStub();
  const generatorStub = makeChangesetGeneratorStub();
  const createGeneratorSpy = vi.fn((_config: ProviderConfig) => generatorStub);
  const writeDraftSpy = vi.fn(
    async (_draft: DraftChangeset) => '.changeset/any-name.md',
  );
  const promptsStub = makePromptsStub();
  const output = new MemoryOutput();
  const theme = createTheme({ color: false });

  const sut = (options: Partial<RunOptions> = {}) =>
    run(
      {
        git: gitStub,
        workspace: workspaceStub,
        reporter: new Reporter({ output, theme, now: () => 0 }),
        theme,
        prompts: withTerminal ? promptsStub : undefined,
        providers,
        createGenerator: createGeneratorSpy,
        writeDraft: writeDraftSpy,
        renderChangeset,
        env,
      },
      {
        yes: false,
        dryRun: false,
        debug: false,
        remote: 'origin',
        pushRefs: [pushRef],
        ...options,
      },
    );

  return {
    sut,
    gitStub,
    workspaceStub,
    generatorStub,
    createGeneratorSpy,
    writeDraftSpy,
    promptsStub,
    output,
  };
};

const majorDraft = {
  releases: [{ name: '@imcauan/logger', bump: 'major' }],
  summary: 'Declare the API stable.',
};

describe('run', () => {
  describe('skipping', () => {
    it('should skip when SKIP_CHANGESET=1 is set', async () => {
      const { sut, output } = makeSut({ env: { SKIP_CHANGESET: '1' } });

      const exitCode = await sut();

      expect({ exitCode, output: output.text }).toEqual({
        exitCode: 0,
        output: '◇  changeset · skipped: SKIP_CHANGESET=1 is set\n',
      });
    });

    it('should skip on a changeset release branch', async () => {
      const { sut, gitStub, output } = makeSut();
      gitStub.currentBranch.mockResolvedValueOnce('changeset-release/main');

      await sut();

      expect(output.text).toBe(
        '◇  changeset · skipped: changeset-release/main is the release branch\n',
      );
    });

    it('should skip a hook push that updates no branch', async () => {
      const { sut, output } = makeSut();

      await sut({ pushRefs: [] });

      expect(output.text).toBe(
        '◇  changeset · skipped: this push updates no branch\n',
      );
    });

    it('should skip when there is no main branch to compare with', async () => {
      const { sut, gitStub, output } = makeSut();
      gitStub.resolveBaseRef.mockResolvedValueOnce(undefined);

      await sut();

      expect(output.text).toBe(
        '◇  changeset · skipped: there is no main branch to compare with\n',
      );
    });

    it('should skip when the branch already has a changeset', async () => {
      const { sut, gitStub, output } = makeSut();
      gitStub.changesetFilesSince.mockResolvedValueOnce([
        '.changeset/any-name.md',
      ]);

      await sut();

      expect(output.text).toBe(
        '◇  changeset · skipped: the branch already has a changeset · .changeset/any-name.md\n',
      );
    });

    it('should compare with the merge base of the base branch', async () => {
      const { sut, gitStub } = makeSut();

      await sut();

      expect(gitStub.mergeBase).toHaveBeenCalledWith('origin/main');
    });

    it('should skip when no published package changed', async () => {
      const { sut, workspaceStub, output } = makeSut();
      workspaceStub.changedPublishedPackages.mockResolvedValueOnce([]);

      await sut();

      expect(output.text).toBe(
        '◇  changeset · skipped: no published package changed\n',
      );
    });

    it('should not call the model when skipping', async () => {
      const { sut, generatorStub } = makeSut({ env: { SKIP_CHANGESET: '1' } });

      await sut();

      expect(generatorStub.generate).not.toHaveBeenCalled();
    });
  });

  describe('drafting', () => {
    it('should call generator.generate with correct values', async () => {
      const { sut, generatorStub } = makeSut();

      await sut();

      expect(generatorStub.generate).toHaveBeenCalledWith({
        changedPackages: ['@imcauan/logger'],
        commits: ['feat(logger): any change'],
        diff: 'any-diff',
      });
    });

    it('should read the diff of the changed packages only', async () => {
      const { sut, gitStub } = makeSut();

      await sut();

      expect(gitStub.diff).toHaveBeenCalledWith('any-base-sha', [
        'packages/logger',
      ]);
    });

    it('should cut a diff longer than the limit', async () => {
      const { sut, gitStub, generatorStub } = makeSut();
      gitStub.diff.mockResolvedValueOnce('x'.repeat(MAX_DIFF_CHARACTERS + 1));

      await sut();

      expect(generatorStub.generate.mock.calls[0]?.[0].diff).toBe(
        `${'x'.repeat(MAX_DIFF_CHARACTERS)}\n[diff cut at ${MAX_DIFF_CHARACTERS} characters]`,
      );
    });

    it('should use the Gemini defaults when no override is set', async () => {
      const { sut, createGeneratorSpy } = makeSut();

      await sut();

      expect(createGeneratorSpy).toHaveBeenCalledWith({
        provider: PROVIDERS[0],
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        model: 'gemini-3.8-flash',
        apiKey: 'any-key',
      });
    });

    it('should not ask which model to use when there is one provider', async () => {
      const { sut, promptsStub } = makeSut();

      await sut();

      expect(promptsStub.selectProvider).not.toHaveBeenCalled();
    });

    it('should ask which model to use when there are several providers', async () => {
      const providers = [
        ...PROVIDERS,
        {
          id: 'any-id',
          label: 'any-label',
          defaultBaseUrl: 'https://any.url/',
          defaultModel: 'any-model',
        },
      ];
      const { sut, promptsStub } = makeSut({ providers });

      await sut();

      expect(promptsStub.selectProvider).toHaveBeenCalledWith(providers);
    });

    it('should reject an unknown --model', async () => {
      const { sut, output } = makeSut();

      const exitCode = await sut({ model: 'any-unknown-model' });

      expect({
        exitCode,
        mentions: output.text.includes('Unknown model "any-unknown-model"'),
      }).toEqual({
        exitCode: 1,
        mentions: true,
      });
    });

    it('should stop when the API key is missing', async () => {
      const { sut, generatorStub } = makeSut({ env: {} });

      await sut();

      expect(generatorStub.generate).not.toHaveBeenCalled();
    });

    it('should say how to set the API key when it is missing', async () => {
      const { sut, output } = makeSut({ env: {} });

      await sut();

      expect(output.text).toContain('CHANGESET_AI_API_KEY is not set.');
    });
  });

  describe('validation', () => {
    it('should retry once when the answer is invalid', async () => {
      const { sut, generatorStub } = makeSut();
      generatorStub.generate.mockResolvedValueOnce({
        releases: [],
        summary: '',
      });

      await sut();

      expect(generatorStub.generate).toHaveBeenCalledTimes(2);
    });

    it('should retry once when the answer is not JSON', async () => {
      const { sut, generatorStub } = makeSut();
      generatorStub.generate.mockRejectedValueOnce(
        new InvalidModelResponseError(['any-problem']),
      );

      await sut();

      expect(generatorStub.generate).toHaveBeenCalledTimes(2);
    });

    it('should stop when the answer is invalid twice', async () => {
      const { sut, generatorStub, output } = makeSut();
      generatorStub.generate.mockResolvedValue({ releases: [], summary: '' });

      const exitCode = await sut();

      expect({
        exitCode,
        mentions: output.text.includes('invalid changeset twice'),
      }).toEqual({
        exitCode: 1,
        mentions: true,
      });
    });

    it('should not retry a failed request', async () => {
      const { sut, generatorStub } = makeSut();
      generatorStub.generate.mockRejectedValueOnce(
        new ChangesetStepError({ what: 'any-what', why: 'any-why' }),
      );

      await sut();

      expect(generatorStub.generate).toHaveBeenCalledTimes(1);
    });

    it('should offer both ways forward when drafting fails', async () => {
      const { sut, generatorStub, output } = makeSut();
      generatorStub.generate.mockRejectedValueOnce(
        new ChangesetStepError({ what: 'any-what', why: 'any-why' }),
      );

      await sut();

      expect(output.text).toMatch(
        /pnpm changeset[\s\S]*SKIP_CHANGESET=1 git push/,
      );
    });

    it('should not commit anything when drafting fails', async () => {
      const { sut, generatorStub, gitStub } = makeSut();
      generatorStub.generate.mockRejectedValueOnce(
        new ChangesetStepError({ what: 'any-what', why: 'any-why' }),
      );

      await sut();

      expect(gitStub.commitFile).not.toHaveBeenCalled();
    });
  });

  describe('major bumps', () => {
    it('should ask before keeping a major bump', async () => {
      const { sut, generatorStub, promptsStub } = makeSut();
      generatorStub.generate.mockResolvedValueOnce(majorDraft);

      await sut();

      expect(promptsStub.confirmMajor).toHaveBeenCalledWith([
        '@imcauan/logger',
      ]);
    });

    it('should stop when the major bump is declined', async () => {
      const { sut, generatorStub, promptsStub, writeDraftSpy } = makeSut();
      generatorStub.generate.mockResolvedValueOnce(majorDraft);
      promptsStub.confirmMajor.mockResolvedValueOnce(false);

      await sut();

      expect(writeDraftSpy).not.toHaveBeenCalled();
    });

    it('should stop on a major bump when there is no terminal', async () => {
      const { sut, generatorStub, writeDraftSpy } = makeSut({
        withTerminal: false,
      });
      generatorStub.generate.mockResolvedValueOnce(majorDraft);

      await sut();

      expect(writeDraftSpy).not.toHaveBeenCalled();
    });

    it('should keep a major bump without asking when --yes is passed', async () => {
      const { sut, generatorStub, promptsStub } = makeSut();
      generatorStub.generate.mockResolvedValueOnce(majorDraft);

      await sut({ yes: true });

      expect(promptsStub.confirmMajor).not.toHaveBeenCalled();
    });
  });

  describe('writing and pushing', () => {
    it('should write the validated draft', async () => {
      const { sut, writeDraftSpy } = makeSut();

      await sut();

      expect(writeDraftSpy).toHaveBeenCalledWith({
        releases: [{ name: '@imcauan/logger', bump: 'minor' }],
        summary: 'Add any feature.',
      });
    });

    it('should call git.commitFile with correct values', async () => {
      const { sut, gitStub } = makeSut();

      await sut();

      expect(gitStub.commitFile).toHaveBeenCalledWith(
        '.changeset/any-name.md',
        'chore: add changeset',
      );
    });

    it('should push again with SKIP_CHANGESET=1', async () => {
      const { sut, gitStub } = makeSut();

      await sut();

      expect(gitStub.push).toHaveBeenCalledWith('origin', [pushRef], {
        setUpstream: false,
        env: { SKIP_CHANGESET: '1' },
      });
    });

    it('should set the upstream when the branch has none', async () => {
      const { sut, gitStub } = makeSut();
      gitStub.hasUpstream.mockResolvedValueOnce(false);

      await sut();

      expect(gitStub.push.mock.calls[0]?.[2].setUpstream).toBe(true);
    });

    it('should exit 1 after pushing again, so git does not push twice', async () => {
      const { sut } = makeSut();

      const exitCode = await sut();

      expect(exitCode).toBe(1);
    });

    it('should show the second push output when it fails', async () => {
      const { sut, gitStub, output } = makeSut();
      gitStub.push.mockResolvedValueOnce({
        ok: false,
        output: 'any-push-error',
      });

      await sut();

      expect(output.text).toContain('any-push-error');
    });

    it('should commit without pushing when not run from the hook', async () => {
      const { sut, gitStub } = makeSut();

      const exitCode = await sut({ remote: undefined, pushRefs: [] });

      expect({ exitCode, pushed: gitStub.push.mock.calls.length }).toEqual({
        exitCode: 0,
        pushed: 0,
      });
    });
  });

  describe('dry run', () => {
    it('should not write the changeset', async () => {
      const { sut, writeDraftSpy } = makeSut();

      await sut({ dryRun: true });

      expect(writeDraftSpy).not.toHaveBeenCalled();
    });

    it('should not commit or push', async () => {
      const { sut, gitStub } = makeSut();

      await sut({ dryRun: true });

      expect([
        gitStub.commitFile.mock.calls.length,
        gitStub.push.mock.calls.length,
      ]).toEqual([0, 0]);
    });

    it('should print the changeset file', async () => {
      const { sut, output } = makeSut();

      await sut({ dryRun: true });

      expect(output.text).toContain('│  "@imcauan/logger": minor');
    });
  });

  describe('errors', () => {
    it('should hide the stack trace of an unexpected error', async () => {
      const { sut, gitStub, output } = makeSut();
      gitStub.currentBranch.mockRejectedValueOnce(new Error('any-message'));

      await sut();

      expect(output.text).not.toMatch(/\bat .+:\d+:\d+/);
    });

    it('should show the stack trace with --debug', async () => {
      const { sut, gitStub, output } = makeSut();
      gitStub.currentBranch.mockRejectedValueOnce(new Error('any-message'));

      await sut({ debug: true });

      expect(output.text).toContain('Error: any-message');
    });
  });
});

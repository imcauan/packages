import { DefaultReporter, type TestCase, type TestModule } from 'vitest/node';

import {
  TestTypeReporter,
  type TestTypeReporterOptions,
} from '../../src/vitest';

/** The parent's part of the prefix (state symbol, project name) is stubbed. */
type ParentReporter = { getEntityPrefix(entity: unknown): string };

/** Exposes the protected prefix the reporter prints before each entity. */
class ExposedTestTypeReporter extends TestTypeReporter {
  prefixFor(entity: TestModule | TestCase): string {
    return this.getEntityPrefix(entity);
  }
}

const makeModule = (moduleId: string) =>
  ({ type: 'module', moduleId }) as unknown as TestModule;

const makeTestCase = (moduleId: string) =>
  ({ type: 'test', module: { moduleId } }) as unknown as TestCase;

const makeSut = (
  options: Partial<TestTypeReporterOptions> = {},
): ExposedTestTypeReporter =>
  new ExposedTestTypeReporter({
    defaultLabel: { label: 'unit', color: 'cyan' },
    labels: [{ pattern: /\.test\.ts$/, label: 'integration', color: 'yellow' }],
    ...options,
  });

describe('TestTypeReporter', () => {
  beforeEach(() => {
    vi.spyOn(
      DefaultReporter.prototype as unknown as ParentReporter,
      'getEntityPrefix',
    ).mockReturnValue('✓');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('without colors', () => {
    beforeEach(() => {
      vi.stubEnv('NO_COLOR', '1');
    });

    it('should label a module with the first matching rule', () => {
      const sut = makeSut();

      const prefix = sut.prefixFor(makeModule('/any/path/any-file.test.ts'));

      expect(prefix).toBe('✓ [integration]');
    });

    it('should label a module with the default label when no rule matches', () => {
      const sut = makeSut();

      const prefix = sut.prefixFor(makeModule('/any/path/any-file.spec.ts'));

      expect(prefix).toBe('✓ [unit]');
    });

    it('should label a test case by its module', () => {
      const sut = makeSut();

      const prefix = sut.prefixFor(makeTestCase('/any/path/any-file.test.ts'));

      expect(prefix).toBe('✓ [integration]');
    });

    it('should use the default label when there are no rules', () => {
      const sut = makeSut({ labels: undefined });

      const prefix = sut.prefixFor(makeModule('/any/path/any-file.test.ts'));

      expect(prefix).toBe('✓ [unit]');
    });
  });

  describe('with colors', () => {
    beforeEach(() => {
      vi.stubEnv('NO_COLOR', '');
    });

    it('should print the label as a bold badge on its color', () => {
      const sut = makeSut();

      const prefix = sut.prefixFor(makeModule('/any/path/any-file.spec.ts'));

      expect(prefix).toBe('✓ \x1b[46m\x1b[97m\x1b[1m unit \x1b[0m');
    });

    it('should use dark text on a yellow badge', () => {
      const sut = makeSut();

      const prefix = sut.prefixFor(makeModule('/any/path/any-file.test.ts'));

      expect(prefix).toBe('✓ \x1b[43m\x1b[30m\x1b[1m integration \x1b[0m');
    });
  });
});

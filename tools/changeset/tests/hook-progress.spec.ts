import { scriptFromBanner } from '../src/hook-progress.ts';

const makeSut = (): typeof scriptFromBanner => scriptFromBanner;

describe('scriptFromBanner', () => {
  it.each([
    ['> any-repo@ lint /any/path', 'lint'],
    ['> any-repo@1.0.0 typecheck /any/path', 'typecheck'],
    ['> @any/repo@ test:unit', 'test:unit'],
    ['\x1b[1m> any-repo@ build /any/path\x1b[22m', 'build'],
  ])('should read the script from %j', (line, script) => {
    const sut = makeSut();

    const result = sut(line);

    expect(result).toBe(script);
  });

  it.each([
    '> oxlint --type-aware .',
    'packages/logger build$ tsdown',
    'any-line',
    '',
  ])('should ignore %j', line => {
    const sut = makeSut();

    const result = sut(line);

    expect(result).toBeUndefined();
  });
});

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import packageJson from '../package.json' with { type: 'json' };

const run = promisify(execFile);
const packageDir = path.resolve(import.meta.dirname, '..');
const tsc = path.resolve(packageDir, 'node_modules/typescript/bin/tsc');

const configs = Object.keys(packageJson.exports)
  .filter(entry => entry.endsWith('.json') && entry !== './package.json')
  .map(entry => entry.slice(2));

describe('published configs', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await mkdtemp(path.join(tmpdir(), 'typescript-config-'));
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it('should export every config listed in files', () => {
    const files = packageJson.files;

    expect(configs).toEqual(files);
  });

  it.each(configs)('should resolve %s as a base config', async config => {
    await writeFile(
      path.join(projectDir, 'tsconfig.json'),
      JSON.stringify({ extends: path.join(packageDir, config) }),
    );
    await writeFile(path.join(projectDir, 'index.ts'), 'export const a = 1;\n');

    const { stdout } = await run(process.execPath, [
      tsc,
      '--showConfig',
      '--project',
      projectDir,
    ]);

    expect(JSON.parse(stdout)).toHaveProperty('compilerOptions');
  });

  it('should not set app-specific path aliases', async () => {
    const results = await Promise.all(
      configs.map(async config => {
        const content = await readFile(path.join(packageDir, config), 'utf8');
        return JSON.parse(content) as { compilerOptions: object };
      }),
    );

    const withPaths = results.filter(
      ({ compilerOptions }) => 'paths' in compilerOptions,
    );

    expect(withPaths).toEqual([]);
  });
});

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeDraft } from '../src/write.ts';
import { Workspace } from '../src/workspace.ts';
import { TempRepository } from './mocks/temp-repository.ts';

describe('Workspace (temporary repository)', () => {
  let repository: TempRepository;
  let sut: Workspace;

  beforeEach(async () => {
    repository = await TempRepository.create();
    sut = new Workspace(repository.dir);
  });

  afterEach(async () => {
    await repository.remove();
  });

  it('should list packages and whether they are published', async () => {
    const packages = await sut.packages();

    expect(packages).toEqual(
      expect.arrayContaining([
        {
          name: '@any/published',
          dir: path.join('packages', 'published'),
          published: true,
        },
        {
          name: '@any/private',
          dir: path.join('packages', 'private'),
          published: false,
        },
      ]),
    );
  });

  it('should list only the published packages the branch changed', async () => {
    await repository.write(
      'packages/published/src/index.ts',
      'export const value = 2;\n',
    );
    await repository.write(
      'packages/private/src/index.ts',
      'export const value = 2;\n',
    );
    await repository.commit('feat: any change', '.');

    const changed = await sut.changedPublishedPackages('origin/main');

    expect(changed.map(pkg => pkg.name)).toEqual(['@any/published']);
  });
});

describe('writeDraft (temporary repository)', () => {
  let repository: TempRepository;

  beforeEach(async () => {
    repository = await TempRepository.create();
  });

  afterEach(async () => {
    await repository.remove();
  });

  it('should write the changeset under .changeset with a random name', async () => {
    const file = await writeDraft(repository.dir, {
      releases: [{ name: '@any/published', bump: 'minor' }],
      summary: 'Add any feature.',
    });

    const content = await readFile(path.join(repository.dir, file), 'utf8');
    expect({ file, content }).toEqual({
      file: expect.stringMatching(/^\.changeset\/[a-z]+(-[a-z]+)+\.md$/),
      content: '---\n"@any/published": minor\n---\n\nAdd any feature.\n',
    });
  });
});

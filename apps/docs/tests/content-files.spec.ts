import { readFileSync } from 'node:fs';
import path from 'node:path';

import { contentFiles } from '../src/lib/content-files';

const makeSut = (): string =>
  readFileSync(path.join(import.meta.dirname, '../src/lib/source.ts'), 'utf8');

describe('contentFiles', () => {
  it('should list the same patterns as the collection in source.ts', () => {
    const sut = makeSut();

    const listed = [...sut.matchAll(/^\s+'([^']+\.md)',$/gm)].map(
      match => match[1],
    );

    expect(listed).toEqual(contentFiles);
  });
});

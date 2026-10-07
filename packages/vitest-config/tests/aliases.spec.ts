import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveWorkspaceAliases } from '../src';

const makeSut = (): typeof resolveWorkspaceAliases => resolveWorkspaceAliases;

describe('resolveWorkspaceAliases', () => {
  it('should resolve each alias target against the root directory', () => {
    const sut = makeSut();

    const aliases = sut('/any/root', { '@': 'src', '@tests': 'tests' });

    expect(aliases).toEqual({
      '@': path.resolve('/any/root', 'src'),
      '@tests': path.resolve('/any/root', 'tests'),
    });
  });

  it('should return no aliases when none are given', () => {
    const sut = makeSut();

    const aliases = sut('/any/root');

    expect(aliases).toEqual({});
  });
});

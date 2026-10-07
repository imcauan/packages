import path from 'node:path';

export type WorkspaceAliasMap = Record<string, string>;

export function resolveWorkspaceAliases(
  rootDir: string,
  aliases: WorkspaceAliasMap = {},
) {
  return Object.fromEntries(
    Object.entries(aliases).map(([name, target]) => [
      name,
      path.resolve(rootDir, target),
    ]),
  );
}

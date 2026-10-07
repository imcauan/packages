import path from 'node:path';

import { getChangedPackagesSinceRef } from '@changesets/git';
import { getPackages } from '@manypkg/get-packages';

export type WorkspacePackage = {
  name: string;
  /** Directory relative to the workspace root. */
  dir: string;
  published: boolean;
};

/** Reads the workspace's packages, using the same rules as Changesets. */
export class Workspace {
  private readonly cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  async packages(): Promise<WorkspacePackage[]> {
    const { rootDir, packages } = await getPackages(this.cwd);
    return packages.map(pkg => ({
      name: pkg.packageJson.name,
      dir: path.relative(rootDir, pkg.dir),
      published: !pkg.packageJson.private,
    }));
  }

  /** Published packages with a file changed since `ref`, as `changeset status` sees them. */
  async changedPublishedPackages(ref: string): Promise<WorkspacePackage[]> {
    const { rootDir } = await getPackages(this.cwd);
    const changed = await getChangedPackagesSinceRef({ cwd: this.cwd, ref });
    return changed
      .filter(pkg => !pkg.packageJson.private)
      .map(pkg => ({
        name: pkg.packageJson.name,
        dir: path.relative(rootDir, pkg.dir),
        published: true,
      }));
  }
}

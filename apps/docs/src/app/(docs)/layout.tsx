import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';

import { site } from '@/lib/site';
import { source } from '@/lib/source';
import { buildTree } from '@/lib/tree';

const tree = buildTree(
  source
    .getPages()
    .map(page => ({ path: page.path, url: page.url, title: page.data.title })),
);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={tree}
      nav={{ title: site.name }}
      githubUrl={`https://github.com/${site.repository}`}
    >
      {children}
    </DocsLayout>
  );
}

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { BookOpen, Compass, Package, Scale } from 'lucide-react';
import type { ReactNode } from 'react';

import { site } from '@/lib/site';
import { source } from '@/lib/source';
import { buildTree } from '@/lib/tree';

const tree = buildTree(
  source
    .getPages()
    .map(page => ({ path: page.path, url: page.url, title: page.data.title })),
  {
    overview: <BookOpen />,
    packages: <Package />,
    guides: <Compass />,
    decisions: <Scale />,
  },
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

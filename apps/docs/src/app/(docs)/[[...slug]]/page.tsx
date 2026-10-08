import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { githubUrl } from '@/lib/site';
import { source } from '@/lib/source';

type Props = { params: Promise<{ slug?: string[] }> };

// Every page is pre-rendered at build time; there is no server to render others.
export const dynamicParams = false;

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = source.getPage((await params).slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}

export default async function Page({ params }: Props) {
  const page = source.getPage((await params).slug);
  if (!page) notFound();
  const Content = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? (
        <DocsDescription>{page.data.description}</DocsDescription>
      ) : null}
      <a
        href={githubUrl(page.path)}
        className="text-fd-muted-foreground hover:text-fd-foreground -mt-4 mb-2 text-sm"
      >
        Edit on GitHub
      </a>
      <DocsBody>
        <Content components={defaultMdxComponents} />
      </DocsBody>
    </DocsPage>
  );
}

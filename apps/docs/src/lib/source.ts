import { loader } from 'fumadocs-core/source';
import { pageSchema } from 'fumadocs-core/source/schema';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { defineCollections } from 'fumadocs-mdx/macro';

import { descriptionFrom, slugsFor, titleFrom } from './content';
import { repoLinkTargets, repoRoot } from './content-files';
import { remarkRepoLinks } from './remark-repo-links';
import { remarkStripTitle } from './remark-strip-title';

/**
 * The repository's own Markdown, rendered as-is: no copies and no
 * frontmatter. Titles and descriptions come from each file's `# H1` and first
 * paragraph; links are resolved against the repository.
 */
const content = defineCollections({
  type: 'doc',
  dir: '../..',
  // Must be string literals here; keep in sync with `contentFiles`.
  files: [
    'README.md',
    'CONSTITUTION.md',
    'CONTRIBUTING.md',
    'docs/*.md',
    'docs/adr/*.md',
    'packages/*/README.md',
    'packages/*/docs/**/*.md',
    'packages/*/CHANGELOG.md',
  ],
  schema: ({ source }) =>
    pageSchema.extend({
      title: pageSchema.shape.title.default(titleFrom(source) ?? 'Untitled'),
      description: pageSchema.shape.description.default(
        descriptionFrom(source) ?? '',
      ),
    }),
  mdxOptions: applyMdxPreset({
    remarkPlugins: defaults => [
      remarkStripTitle,
      [remarkRepoLinks, { root: repoRoot, targets: repoLinkTargets() }],
      ...defaults,
    ],
  }),
});

export const source = loader({
  baseUrl: '/',
  source: content.toFumadocsSource(),
  slugs: file => slugsFor(file.path),
});

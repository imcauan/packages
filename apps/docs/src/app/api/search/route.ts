import { createFromSource } from 'fumadocs-core/search/server';

import { source } from '@/lib/source';

// Built once: the search index is written to out/ as a static file.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  language: 'english',
});

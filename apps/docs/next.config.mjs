import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// `/packages` on GitHub Pages (a project site), empty locally.
const basePath = process.env.DOCS_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const config = {
  // Static site generation: `next build` writes plain HTML to out/.
  output: 'export',
  trailingSlash: true,
  basePath,
  // Client code (the search index URL) needs the base path too.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  reactStrictMode: true,
};

export default withMDX(config);

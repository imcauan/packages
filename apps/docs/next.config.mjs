import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// `/packages` on GitHub Pages (a project site), empty locally.
const basePath = process.env.DOCS_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const config = {
  // Static site generation: `next build` writes plain HTML to out/.
  output: 'export',
  trailingSlash: true,
  // No server, so no image optimization API: images are served as they are.
  images: { unoptimized: true },
  basePath,
  // Client code (the search index URL) needs the base path too.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  reactStrictMode: true,
  typescript: { tsconfigPath: 'tsconfig.build.json' },
};

export default withMDX(config);

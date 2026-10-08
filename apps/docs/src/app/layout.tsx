import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Provider } from '@/components/provider';
import { site } from '@/lib/site';
import './global.css';

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  metadataBase: new URL(site.url),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

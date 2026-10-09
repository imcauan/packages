import type { Provider } from '@imcauan/dependency-injection';
import { DependencyProvider } from '@imcauan/dependency-injection/react';
import { Test } from '@imcauan/dependency-injection/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';

export type Harness = {
  queryClient: QueryClient;
  wrapper: ComponentType<{ children: ReactNode }>;
};

/** A DI container with `providers` and a QueryClient, wrapped for renderHook. */
export const makeHarness = (providers: readonly Provider[]): Harness => {
  const { container } = Test.createTestingModule({ providers }).compile();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <DependencyProvider container={container}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </DependencyProvider>
  );

  return { queryClient, wrapper };
};

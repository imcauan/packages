import { createContext } from 'react';
import type { DependencyContainer } from '../core/index.js';

export const DependencyContext = createContext<DependencyContainer | null>(
  null,
);

/**
 * Makes an existing dependency container available to React hooks.
 *
 * React does not own or create the container; application composition should
 * create it and pass it here.
 */
export function DependencyProvider({
  container,
  children,
}: {
  container: DependencyContainer;
  children: React.ReactNode;
}) {
  return (
    <DependencyContext.Provider value={container}>
      {children}
    </DependencyContext.Provider>
  );
}

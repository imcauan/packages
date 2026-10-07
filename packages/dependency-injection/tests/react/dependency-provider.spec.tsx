// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DependencyContainer, Module, createInjectionToken } from '../../src';
import {
  MissingDependencyProviderError,
  DependencyProvider,
  useDependency,
  useDependencyContainer,
} from '../../src/react';

const Message = createInjectionToken<string>('Message');

@Module({ providers: [{ provide: Message, useValue: 'any-message' }] })
class MessageModule {}

function MessageConsumer() {
  return <p>{useDependency(Message)}</p>;
}

function ContainerConsumer({
  onContainer,
}: {
  onContainer(container: DependencyContainer): void;
}) {
  onContainer(useDependencyContainer());
  return null;
}

type SutTypes = {
  container: DependencyContainer;
};

const makeSut = (children: React.ReactNode): SutTypes => {
  const container = DependencyContainer.create(MessageModule);
  render(
    <DependencyProvider container={container}>{children}</DependencyProvider>,
  );
  return { container };
};

describe('DependencyProvider', () => {
  afterEach(() => {
    cleanup();
  });

  describe('useDependency', () => {
    it('should resolve a token from the provided container', () => {
      makeSut(<MessageConsumer />);

      const message = screen.getByText('any-message');

      expect(message).toBeTruthy();
    });

    it('should throw MissingDependencyProviderError outside a provider', () => {
      const renderOutside = () => render(<MessageConsumer />);

      expect(renderOutside).toThrow(MissingDependencyProviderError);
    });
  });

  describe('useDependencyContainer', () => {
    it('should return the provided container', () => {
      let received: DependencyContainer | undefined;

      const { container } = makeSut(
        <ContainerConsumer onContainer={value => (received = value)} />,
      );

      expect(received).toBe(container);
    });
  });
});

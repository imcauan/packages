import { vi, type Mock } from 'vitest';

import { TestContainer, type TestContainerOptions } from '../../src';

/** Concrete TestContainer whose start and stop steps are spies. */
export class FakeContainer extends TestContainer {
  readonly start: Mock<() => Promise<void>> = vi.fn(async () => {});
  readonly stop: Mock<() => Promise<void>> = vi.fn(async () => {});

  constructor(options?: TestContainerOptions) {
    super(options);
  }

  protected doStart(): Promise<void> {
    return this.start();
  }

  protected doStop(): Promise<void> {
    return this.stop();
  }
}

import {
  ContainerEvent,
  ContainerHook,
  ContainerHooks,
} from './container.types';

export interface TestContainerOptions {
  hooks?: ContainerHooks;
}

export abstract class TestContainer {
  private readonly hookMap = new Map<ContainerEvent, ContainerHook[]>(
    Object.values(ContainerEvent).map(event => [event, []]),
  );
  private _isRunning = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  constructor({ hooks }: TestContainerOptions = {}) {
    if (hooks) {
      this.registerHooks(ContainerEvent.BEFORE_START, hooks.beforeStart);
      this.registerHooks(ContainerEvent.AFTER_START, hooks.afterStart);
      this.registerHooks(ContainerEvent.BEFORE_STOP, hooks.beforeStop);
      this.registerHooks(ContainerEvent.AFTER_STOP, hooks.afterStop);
    }
  }

  protected abstract doStart(): Promise<void>;
  protected abstract doStop(): Promise<void>;

  on(event: ContainerEvent, hook: ContainerHook): this {
    this.hookMap.get(event)!.push(hook);
    return this;
  }

  async init(): Promise<void> {
    if (this._isRunning) return;
    await this.runHooks(ContainerEvent.BEFORE_START);
    await this.doStart();
    this._isRunning = true;
    await this.runHooks(ContainerEvent.AFTER_START);
  }

  async [Symbol.asyncDispose](): Promise<void> {
    if (!this._isRunning) return;
    await this.runHooks(ContainerEvent.BEFORE_STOP);
    await this.doStop();
    this._isRunning = false;
    await this.runHooks(ContainerEvent.AFTER_STOP);
  }

  private registerHooks(
    event: ContainerEvent,
    hook?: ContainerHook | ContainerHook[],
  ): void {
    if (!hook) return;
    const list = Array.isArray(hook) ? hook : [hook];
    this.hookMap.get(event)!.push(...list);
  }

  private async runHooks(event: ContainerEvent): Promise<void> {
    for (const hook of this.hookMap.get(event) ?? []) await hook();
  }
}

export const ContainerEvent = {
  BEFORE_START: 'before:start',
  AFTER_START: 'after:start',
  BEFORE_STOP: 'before:stop',
  AFTER_STOP: 'after:stop',
} as const;

export type ContainerEvent =
  (typeof ContainerEvent)[keyof typeof ContainerEvent];
export type ContainerHook = () => void | Promise<void>;

export interface ContainerHooks {
  beforeStart?: ContainerHook | ContainerHook[];
  afterStart?: ContainerHook | ContainerHook[];
  beforeStop?: ContainerHook | ContainerHook[];
  afterStop?: ContainerHook | ContainerHook[];
}

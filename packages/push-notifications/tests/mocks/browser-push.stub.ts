import type { Mock } from 'vitest';

type PushSubscriptionStub = {
  toJSON: Mock<() => PushSubscriptionJSON>;
  unsubscribe: Mock<() => Promise<boolean>>;
};

type RegistrationStub = {
  pushManager: {
    getSubscription: Mock<() => Promise<PushSubscriptionStub | null>>;
    subscribe: Mock<
      (options: PushSubscriptionOptionsInit) => Promise<PushSubscriptionStub>
    >;
  };
};

export type BrowserPushStub = {
  pushSubscription: PushSubscriptionStub;
  pushManager: RegistrationStub['pushManager'];
  serviceWorker: {
    getRegistration: Mock<(url: string) => Promise<RegistrationStub>>;
    register: Mock<
      (url: string, options: RegistrationOptions) => Promise<RegistrationStub>
    >;
    ready: Promise<RegistrationStub>;
  };
  notification: {
    requestPermission: Mock<() => Promise<NotificationPermission>>;
  };
};

/** Browser push APIs as stubs, configured for the happy path. */
export const makeBrowserPushStub = (): BrowserPushStub => {
  const pushSubscription = {
    toJSON: vi.fn().mockReturnValue({
      endpoint: 'any-endpoint',
      keys: { p256dh: 'any-p256dh', auth: 'any-auth' },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(pushSubscription),
    subscribe: vi.fn().mockResolvedValue(pushSubscription),
  };
  const registration = { pushManager };
  const serviceWorker = {
    getRegistration: vi.fn().mockResolvedValue(registration),
    register: vi.fn().mockResolvedValue(registration),
    ready: Promise.resolve(registration),
  };
  const notification = {
    requestPermission: vi.fn().mockResolvedValue('granted'),
  };

  return { pushSubscription, pushManager, serviceWorker, notification };
};

/** Installs the stubs as the browser globals. */
export const stubBrowserPush = (stub: BrowserPushStub): void => {
  vi.stubGlobal('window', { PushManager: class {} });
  vi.stubGlobal('navigator', { serviceWorker: stub.serviceWorker });
  vi.stubGlobal('Notification', stub.notification);
};

/** A runtime without the Push API, such as a server or an old browser. */
export const stubNoPushSupport = (): void => {
  vi.stubGlobal('window', {});
  vi.stubGlobal('navigator', {});
};

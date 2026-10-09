import {
  PushNotSupportedError,
  PushPermissionDeniedError,
  type BrowserPushGateway,
  type IPushSubscriber,
  type IPushSubscriptionReader,
  type IPushSupportCheck,
  type IPushUnsubscriber,
} from '..';
import {
  isPushSupported,
  toSubscription,
  urlBase64ToUint8Array,
} from './push-subscription';

export type WebPushGatewayConfig = {
  serviceWorkerUrl?: string;
  scope?: string;
};

const DEFAULT_SERVICE_WORKER_URL = '/sw.js';
const DEFAULT_SCOPE = '/';

/**
 * Subscribes this browser to push with the service worker, Push and
 * Notification APIs. The app ships the service worker; set
 * `serviceWorkerUrl` and `scope` when it isn't at `/sw.js` and `/`.
 */
export class WebPushGateway
  implements
    IPushSupportCheck,
    IPushSubscriptionReader,
    IPushSubscriber,
    IPushUnsubscriber
{
  private readonly serviceWorkerUrl: string;
  private readonly scope: string;

  constructor(config: WebPushGatewayConfig = {}) {
    this.serviceWorkerUrl =
      config.serviceWorkerUrl ?? DEFAULT_SERVICE_WORKER_URL;
    this.scope = config.scope ?? DEFAULT_SCOPE;
  }

  isSupported(): boolean {
    return isPushSupported();
  }

  async getExistingSubscription(): Promise<BrowserPushGateway.Subscription | null> {
    if (!this.isSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.getRegistration(
      this.serviceWorkerUrl,
    );
    const subscription = await registration?.pushManager.getSubscription();

    return subscription ? toSubscription(subscription) : null;
  }

  async subscribe(
    vapidPublicKey: string,
  ): Promise<BrowserPushGateway.Subscription> {
    if (!this.isSupported()) {
      throw new PushNotSupportedError();
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      throw new PushPermissionDeniedError();
    }

    const registration = await navigator.serviceWorker.register(
      this.serviceWorkerUrl,
      { scope: this.scope },
    );

    await navigator.serviceWorker.ready;

    const existingSubscription =
      await registration.pushManager.getSubscription();

    if (existingSubscription) {
      return toSubscription(existingSubscription);
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    return toSubscription(subscription);
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration(
      this.serviceWorkerUrl,
    );
    const subscription = await registration?.pushManager.getSubscription();

    await subscription?.unsubscribe();
  }
}

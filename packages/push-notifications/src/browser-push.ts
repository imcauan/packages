import type { WebPushSubscription } from './subscription';

export namespace BrowserPushGateway {
  export type Subscription = WebPushSubscription;
}

/** Whether this browser supports push, without prompting the user. */
export interface IPushSupportCheck {
  isSupported(): boolean;
}

/** This browser's current subscription, if any, without prompting the user. */
export interface IPushSubscriptionReader {
  getExistingSubscription(): Promise<BrowserPushGateway.Subscription | null>;
}

/**
 * Asks for notification permission and subscribes this browser. Throws when
 * push isn't supported, permission is denied, or subscribing fails.
 */
export interface IPushSubscriber {
  subscribe(vapidPublicKey: string): Promise<BrowserPushGateway.Subscription>;
}

/** Unsubscribes this browser. Does nothing when there's no subscription. */
export interface IPushUnsubscriber {
  unsubscribe(): Promise<void>;
}

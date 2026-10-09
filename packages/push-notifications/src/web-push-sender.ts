import type { WebPushSubscription } from './subscription';

export namespace WebPushSender {
  export type Subscription = WebPushSubscription;
  export type Payload = {
    title: string;
    body: string;
  };
  export type Params = {
    subscription: Subscription;
    payload: Payload;
  };
  export type Response = Promise<void>;
}

/** Injection token for an `IWebPushSender`. */
export const WebPushSender = Symbol('WebPushSender');

/**
 * Sends one push notification to one subscription. Throws
 * `PushDeliveryGoneError` when the subscription no longer exists.
 */
export interface IWebPushSender {
  send(params: WebPushSender.Params): WebPushSender.Response;
}

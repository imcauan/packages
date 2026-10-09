import webpush from 'web-push';

import {
  PushDeliveryGoneError,
  type IWebPushSender,
  type WebPushSender,
} from '..';

/** VAPID details: your key pair and a contact (`mailto:` or `https:` URL). */
export type WebPushSenderConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

/** True for the status codes push services use for a dead subscription. */
function isGoneStatus(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return false;
  }

  return error.statusCode === 404 || error.statusCode === 410;
}

/**
 * Sends notifications with the `web-push` library. The payload is sent as
 * JSON; your service worker parses it.
 */
export class WebPushSenderGateway implements IWebPushSender {
  constructor(config: WebPushSenderConfig) {
    webpush.setVapidDetails(
      config.subject,
      config.publicKey,
      config.privateKey,
    );
  }

  async send(params: WebPushSender.Params): WebPushSender.Response {
    try {
      await webpush.sendNotification(
        {
          endpoint: params.subscription.endpoint,
          keys: {
            p256dh: params.subscription.p256dh,
            auth: params.subscription.auth,
          },
        },
        JSON.stringify(params.payload),
      );
    } catch (error) {
      if (isGoneStatus(error)) throw new PushDeliveryGoneError();

      throw error;
    }
  }
}

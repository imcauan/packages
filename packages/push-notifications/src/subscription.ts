/** A push subscription as plain data: what a browser sends to your server. */
export type WebPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

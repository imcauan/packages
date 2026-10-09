/** The push service says the subscription no longer exists (404 or 410). */
export class PushDeliveryGoneError extends Error {
  constructor() {
    super('Push subscription is no longer valid');
    this.name = 'PushDeliveryGoneError';
  }
}

/** A browser subscription is missing its endpoint or keys. */
export class InvalidPushSubscriptionError extends Error {
  constructor() {
    super('Push subscription is missing required fields.');
    this.name = 'InvalidPushSubscriptionError';
  }
}

/** This browser has no service worker or Push API. */
export class PushNotSupportedError extends Error {
  constructor() {
    super('Push notifications are not supported in this browser.');
    this.name = 'PushNotSupportedError';
  }
}

/** The user didn't grant the notification permission. */
export class PushPermissionDeniedError extends Error {
  constructor() {
    super('Notification permission was not granted.');
    this.name = 'PushPermissionDeniedError';
  }
}

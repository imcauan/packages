# @imcauan/push-notifications

Web Push for both ends: a browser adapter that subscribes the user, a sender
for the server built on [`web-push`](https://github.com/web-push-libs/web-push),
and a NestJS module that provides the sender.

## Install

```bash
pnpm add @imcauan/push-notifications
```

The core and the browser adapter have no dependencies. For the server:

```bash
pnpm add web-push
```

| Peer             | Range     | Needed for                         |
| ---------------- | --------- | ---------------------------------- |
| `web-push`       | `^3.6.0`  | `/web-push`, `/nestjs`             |
| `@nestjs/common` | `^12.0.0` | `/nestjs` (your NestJS app has it) |

Both are optional peers. See the [root README](../../README.md#install) to
set up the GitHub Packages registry.

## Usage

The core holds the ports, the shared subscription shape and the errors, so
code that sends or stores subscriptions doesn't depend on an adapter:

```ts
import {
  PushDeliveryGoneError,
  type IWebPushSender,
  type WebPushSubscription,
} from '@imcauan/push-notifications';

export class NotifyUser {
  constructor(private readonly sender: IWebPushSender) {}

  async execute(subscription: WebPushSubscription) {
    try {
      await this.sender.send({
        subscription,
        payload: { title: 'Reminder', body: 'Your meeting starts soon' },
      });
    } catch (error) {
      if (error instanceof PushDeliveryGoneError) {
        // the user unsubscribed or the subscription expired: delete it
        return;
      }
      throw error;
    }
  }
}
```

## Integrations

### Browser

`WebPushGateway` subscribes this browser with the service worker, Push and
Notification APIs. The app ships its own service worker; the defaults are
`/sw.js` and scope `/`.

```ts
import { WebPushGateway } from '@imcauan/push-notifications/browser';

const push = new WebPushGateway({ serviceWorkerUrl: '/sw.js', scope: '/' });

if (push.isSupported()) {
  const subscription = await push.subscribe(vapidPublicKey);
  await api.saveSubscription(subscription); // { endpoint, p256dh, auth }
}
```

- `subscribe` asks for notification permission, registers the service
  worker, and returns the existing subscription or creates one. It throws
  `PushNotSupportedError` or `PushPermissionDeniedError`.
- `getExistingSubscription` and `isSupported` never prompt the user.
- `unsubscribe` does nothing when there's no subscription.

Importing it on the server is safe: support is feature-detected.

### web-push (server)

`WebPushSenderGateway` is an `IWebPushSender` over the `web-push` library.
It sends the payload as JSON, and throws `PushDeliveryGoneError` when the
push service answers 404 or 410.

```ts
import { WebPushSenderGateway } from '@imcauan/push-notifications/web-push';

const sender = new WebPushSenderGateway({
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: 'mailto:ops@example.com',
});
```

Generate a key pair with `npx web-push generate-vapid-keys`.

### NestJS

`WebPushGatewayModule.registerAsync` provides and exports `WebPushSender`,
built from the VAPID config your factory returns:

```ts
import { WebPushGatewayModule } from '@imcauan/push-notifications/nestjs';

@Module({
  imports: [
    WebPushGatewayModule.registerAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        publicKey: config.vapidPublicKey,
        privateKey: config.vapidPrivateKey,
        subject: config.vapidSubject,
      }),
    }),
  ],
})
export class NotificationsModule {}
```

The injected tokens must be visible to the module, for example from a
global module. Or skip the module and add `makeWebPushSenderProvider(options)`
to your own module's `providers`.

## API

`@imcauan/push-notifications`

- `WebPushSubscription`: `{ endpoint, p256dh, auth }`.
- `IWebPushSender`: `send({ subscription, payload: { title, body } })`.
- `WebPushSender`: namespace with `send`'s types, and an injection token.
- `IPushSupportCheck`, `IPushSubscriptionReader`, `IPushSubscriber`,
  `IPushUnsubscriber`: the browser-side ports; `BrowserPushGateway` holds
  their `Subscription` type.
- `PushDeliveryGoneError`, `InvalidPushSubscriptionError`,
  `PushNotSupportedError`, `PushPermissionDeniedError`.

`@imcauan/push-notifications/browser`

- `WebPushGateway(config?)`: implements the four browser ports.
- `WebPushGatewayConfig`: `{ serviceWorkerUrl?, scope? }`.

`@imcauan/push-notifications/web-push`

- `WebPushSenderGateway(config)`: an `IWebPushSender` over `web-push`.
- `WebPushSenderConfig`: `{ publicKey, privateKey, subject }`.

`@imcauan/push-notifications/nestjs`

- `WebPushGatewayModule.registerAsync({ inject?, useFactory })`.
- `makeWebPushSenderProvider({ inject?, useFactory })`: the provider the
  module uses.
- `WebPushGatewayAsyncOptions`, `MakeWebPushSenderProviderOptions`.

## Design notes

- `WebPushSenderGateway` sets the VAPID details on the `web-push` library,
  which keeps one set per process. Use one key pair per app.
- The payload is `{ title, body }` as JSON. Your service worker decides how
  to show it.

## License

MIT

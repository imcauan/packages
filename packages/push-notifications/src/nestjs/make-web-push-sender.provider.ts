import type {
  FactoryProvider,
  InjectionToken,
  OptionalFactoryDependency,
} from '@nestjs/common';

import { WebPushSender, type IWebPushSender } from '..';
import { WebPushSenderGateway, type WebPushSenderConfig } from '../web-push';

export type MakeWebPushSenderProviderOptions = {
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory(
    ...args: unknown[]
  ): WebPushSenderConfig | Promise<WebPushSenderConfig>;
};

/**
 * A provider that binds `WebPushSender` to a `WebPushSenderGateway` built from
 * the config your factory returns. Use it directly in a module's `providers`,
 * or through `WebPushGatewayModule.registerAsync`.
 */
export function makeWebPushSenderProvider(
  options: MakeWebPushSenderProviderOptions,
): FactoryProvider<IWebPushSender> {
  return {
    provide: WebPushSender,
    inject: options.inject ?? [],
    useFactory: async (...args: unknown[]) =>
      new WebPushSenderGateway(await options.useFactory(...args)),
  };
}

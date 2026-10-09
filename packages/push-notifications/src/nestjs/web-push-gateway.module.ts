import { Module, type DynamicModule } from '@nestjs/common';

import { WebPushSender } from '..';
import {
  makeWebPushSenderProvider,
  type MakeWebPushSenderProviderOptions,
} from './make-web-push-sender.provider';

export type WebPushGatewayAsyncOptions = MakeWebPushSenderProviderOptions;

/**
 * Provides and exports `WebPushSender`, built from the VAPID config your
 * factory returns (typically from your app's configuration).
 */
@Module({})
export class WebPushGatewayModule {
  static registerAsync(options: WebPushGatewayAsyncOptions): DynamicModule {
    return {
      module: WebPushGatewayModule,
      providers: [makeWebPushSenderProvider(options)],
      exports: [WebPushSender],
    };
  }
}

import 'reflect-metadata';

import { Global, Module } from '@nestjs/common';
import webpush from 'web-push';
import { Test, type TestingModule } from '@nestjs/testing';

import { WebPushSender } from '../../src';
import {
  makeWebPushSenderProvider,
  WebPushGatewayModule,
} from '../../src/nestjs';
import { WebPushSenderGateway } from '../../src/web-push';

const VAPID_CONFIG = Symbol('VAPID_CONFIG');

const vapid = {
  ...webpush.generateVAPIDKeys(),
  subject: 'mailto:any@email.com',
};

@Global()
@Module({
  providers: [{ provide: VAPID_CONFIG, useValue: vapid }],
  exports: [VAPID_CONFIG],
})
class ConfigModule {}

describe('WebPushGatewayModule (NestJS)', () => {
  let moduleRef: TestingModule;

  afterEach(async () => {
    await moduleRef.close();
  });

  it('should provide WebPushSender built from the injected config', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        WebPushGatewayModule.registerAsync({
          inject: [VAPID_CONFIG],
          useFactory: (config: typeof vapid) => config,
        }),
      ],
    }).compile();

    const sender: unknown = moduleRef.get(WebPushSender);

    expect(sender).toBeInstanceOf(WebPushSenderGateway);
  });
});

describe('makeWebPushSenderProvider', () => {
  it('should bind WebPushSender to a WebPushSenderGateway', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [makeWebPushSenderProvider({ useFactory: () => vapid })],
    }).compile();

    const sender: unknown = moduleRef.get(WebPushSender);

    expect(sender).toBeInstanceOf(WebPushSenderGateway);
    await moduleRef.close();
  });
});

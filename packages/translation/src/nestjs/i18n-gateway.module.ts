import { Module, type DynamicModule } from '@nestjs/common';
import { I18nModule, type I18nOptions } from 'nestjs-i18n';

/**
 * Sets up nestjs-i18n (`I18nModule.forRoot`) and re-exports it, so modules
 * that import this one can inject `I18nService`. It registers no translator
 * of its own: wrap `I18nService` in `NestI18nTranslatorAdapter` where you
 * need one.
 */
@Module({})
export class I18nGatewayModule {
  static register(options: I18nOptions): DynamicModule {
    const i18nModule = I18nModule.forRoot(options);

    return {
      module: I18nGatewayModule,
      imports: [i18nModule],
      exports: [i18nModule],
    };
  }
}

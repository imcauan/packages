import { Module, type DynamicModule } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';

/**
 * Sets up `@nestjs/jwt` (`JwtModule.register`) and re-exports it, so modules
 * that import this one can inject `JwtService`. It registers no signer or
 * verifier: provide those around `NestJsJwtTokenGateway`.
 */
@Module({})
export class JwtGatewayModule {
  static register(options: JwtModuleOptions = {}): DynamicModule {
    const jwtModule = JwtModule.register(options);

    return {
      module: JwtGatewayModule,
      imports: [jwtModule],
      exports: [jwtModule],
    };
  }
}

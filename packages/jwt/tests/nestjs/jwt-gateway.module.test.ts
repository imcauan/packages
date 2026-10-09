import 'reflect-metadata';

import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';

import { JwtGatewayModule } from '../../src/nestjs';

describe('JwtGatewayModule (NestJS)', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [JwtGatewayModule.register({ secret: 'any-secret' })],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('should provide JwtService', () => {
    const jwtService = moduleRef.get(JwtService);

    expect(jwtService).toBeInstanceOf(JwtService);
  });

  it('should configure JwtService with the given options', async () => {
    const jwtService = moduleRef.get(JwtService);

    const token = await jwtService.signAsync({ sub: 'any-subject' });

    const payload: unknown = jwtService.verify(token, { secret: 'any-secret' });
    expect(payload).toMatchObject({
      sub: 'any-subject',
    });
  });
});

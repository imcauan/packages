import { JwtService } from '@nestjs/jwt';

import { InvalidTokenError, TokenIssuerMismatchError } from '../../src';
import { NestJsJwtTokenGateway } from '../../src/nestjs';

type SutTypes = {
  sut: NestJsJwtTokenGateway;
  jwtService: JwtService;
};

const makeSut = (): SutTypes => {
  const jwtService = new JwtService();
  const sut = new NestJsJwtTokenGateway(jwtService);

  return { sut, jwtService };
};

const signParams = {
  subject: 'any-subject',
  issuer: 'any-issuer',
  secret: 'any-secret',
  expiresIn: 60,
  payload: { role: 'any-role' },
};

describe('NestJsJwtTokenGateway', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sign', () => {
    it('should call jwtService.signAsync with correct values', async () => {
      const { sut, jwtService } = makeSut();
      const signAsync = vi.spyOn(jwtService, 'signAsync');

      await sut.sign(signParams);

      expect(signAsync).toHaveBeenCalledWith(
        { role: 'any-role' },
        {
          subject: 'any-subject',
          issuer: 'any-issuer',
          expiresIn: 60,
          secret: 'any-secret',
        },
      );
    });

    it('should return a token that carries the claims', async () => {
      const { sut, jwtService } = makeSut();

      const token = await sut.sign(signParams);

      const claims: unknown = jwtService.decode(token);
      expect(claims).toMatchObject({
        sub: 'any-subject',
        iss: 'any-issuer',
        role: 'any-role',
      });
    });
  });

  describe('verify', () => {
    it('should return the claims of a valid token', async () => {
      const { sut } = makeSut();
      const token = await sut.sign(signParams);

      const payload = await sut.verify({
        token,
        issuer: 'any-issuer',
        secret: 'any-secret',
      });

      expect(payload).toMatchObject({
        sub: 'any-subject',
        iss: 'any-issuer',
        role: 'any-role',
      });
    });

    it('should throw InvalidTokenError, with the cause, when the secret differs', async () => {
      const { sut } = makeSut();
      const token = await sut.sign(signParams);

      const promise = sut.verify({
        token,
        issuer: 'any-issuer',
        secret: 'other-secret',
      });

      await expect(promise).rejects.toThrow(InvalidTokenError);
      await expect(promise).rejects.toMatchObject({
        cause: expect.objectContaining({ name: 'JsonWebTokenError' }),
      });
    });

    it('should throw InvalidTokenError when the token has expired', async () => {
      const { sut } = makeSut();
      const token = await sut.sign({ ...signParams, expiresIn: -1 });

      const promise = sut.verify({
        token,
        issuer: 'any-issuer',
        secret: 'any-secret',
      });

      await expect(promise).rejects.toThrow(InvalidTokenError);
    });

    it('should throw InvalidTokenError when the token is malformed', async () => {
      const { sut } = makeSut();

      const promise = sut.verify({
        token: 'any-token',
        issuer: 'any-issuer',
        secret: 'any-secret',
      });

      await expect(promise).rejects.toThrow(InvalidTokenError);
    });

    it('should throw TokenIssuerMismatchError when the issuer differs', async () => {
      const { sut } = makeSut();
      const token = await sut.sign(signParams);

      const promise = sut.verify({
        token,
        issuer: 'other-issuer',
        secret: 'any-secret',
      });

      await expect(promise).rejects.toThrow(TokenIssuerMismatchError);
    });
  });
});

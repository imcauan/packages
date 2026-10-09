import {
  InvalidTokenError,
  TokenIssuerMismatchError,
  TokenVerificationError,
} from '../src';

describe('InvalidTokenError', () => {
  it('should be a TokenVerificationError', () => {
    const sut = new InvalidTokenError(new Error('any-message'));

    expect(sut).toBeInstanceOf(TokenVerificationError);
  });

  it('should keep the original error as its cause', () => {
    const cause = new Error('any-message');

    const sut = new InvalidTokenError(cause);

    expect(sut.cause).toBe(cause);
  });

  it('should be named InvalidTokenError', () => {
    const sut = new InvalidTokenError(new Error('any-message'));

    expect(sut.name).toBe('InvalidTokenError');
  });
});

describe('TokenIssuerMismatchError', () => {
  it('should be a TokenVerificationError', () => {
    const sut = new TokenIssuerMismatchError();

    expect(sut).toBeInstanceOf(TokenVerificationError);
  });

  it('should be named TokenIssuerMismatchError', () => {
    const sut = new TokenIssuerMismatchError();

    expect(sut.name).toBe('TokenIssuerMismatchError');
  });
});

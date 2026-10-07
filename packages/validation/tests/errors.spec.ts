import { ValidationError } from '../src';

const makeSut = (): ValidationError =>
  new ValidationError([
    { path: ['first'], code: 'any-code', message: 'any-first-message' },
    { path: ['second'], code: 'any-code', message: 'any-second-message' },
  ]);

describe('ValidationError', () => {
  it('should join the issue messages', () => {
    const sut = makeSut();

    const { message } = sut;

    expect(message).toBe('any-first-message, any-second-message');
  });

  it('should keep the issues', () => {
    const sut = makeSut();

    const { issues } = sut;

    expect(issues).toEqual([
      { path: ['first'], code: 'any-code', message: 'any-first-message' },
      { path: ['second'], code: 'any-code', message: 'any-second-message' },
    ]);
  });

  it('should be named ValidationError', () => {
    const sut = makeSut();

    const { name } = sut;

    expect(name).toBe('ValidationError');
  });
});

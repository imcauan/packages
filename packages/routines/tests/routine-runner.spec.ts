import type { Mocked } from 'vitest';

import { RoutineRunner, type ILogger, type IRoutineHandler } from '../src';
import { makeLoggerStub } from './mocks/logger.stub';
import { makeRoutineHandlerStub } from './mocks/routine-handler.stub';

type SutTypes = {
  sut: RoutineRunner;
  handlerStub: Mocked<IRoutineHandler>;
  loggerStub: Mocked<ILogger>;
};

const makeSut = (): SutTypes => {
  const handlerStub = makeRoutineHandlerStub();
  const loggerStub = makeLoggerStub();
  const sut = new RoutineRunner('any-routine', handlerStub, loggerStub);

  return { sut, handlerStub, loggerStub };
};

/** Makes the next `execute()` hang until the returned function is called. */
const holdNextExecute = (handlerStub: Mocked<IRoutineHandler>) => {
  let release!: () => void;
  handlerStub.execute.mockImplementationOnce(
    () => new Promise<void>(resolve => (release = resolve)),
  );
  return () => release();
};

describe('RoutineRunner', () => {
  describe('run', () => {
    it('should call handler.execute', async () => {
      const { sut, handlerStub } = makeSut();

      await sut.run();

      expect(handlerStub.execute).toHaveBeenCalledOnce();
    });

    it('should skip the tick while the previous run is in flight', async () => {
      const { sut, handlerStub } = makeSut();
      const release = holdNextExecute(handlerStub);
      const firstRun = sut.run();

      await sut.run();

      expect(handlerStub.execute).toHaveBeenCalledOnce();
      release();
      await firstRun;
    });

    it('should call logger.warn with correct values when it skips a tick', async () => {
      const { sut, handlerStub, loggerStub } = makeSut();
      const release = holdNextExecute(handlerStub);
      const firstRun = sut.run();

      await sut.run();

      expect(loggerStub.warn).toHaveBeenCalledWith(
        'Previous run still in progress, skipping this tick',
      );
      release();
      await firstRun;
    });

    it('should run again once the in-flight run finishes', async () => {
      const { sut, handlerStub } = makeSut();
      const release = holdNextExecute(handlerStub);
      const firstRun = sut.run();
      release();
      await firstRun;

      await sut.run();

      expect(handlerStub.execute).toHaveBeenCalledTimes(2);
    });

    it('should resolve when execute rejects', async () => {
      const { sut, handlerStub } = makeSut();
      handlerStub.execute.mockRejectedValueOnce(new Error('any-message'));

      const promise = sut.run();

      await expect(promise).resolves.toBeUndefined();
    });

    it('should call handler.onError with the error when execute rejects', async () => {
      const { sut, handlerStub } = makeSut();
      const error = new Error('any-message');
      handlerStub.onError = vi.fn();
      handlerStub.execute.mockRejectedValueOnce(error);

      await sut.run();

      expect(handlerStub.onError).toHaveBeenCalledWith(error);
    });

    it('should call logger.error with correct values when execute rejects and there is no onError', async () => {
      const { sut, handlerStub, loggerStub } = makeSut();
      const error = new Error('any-message');
      handlerStub.execute.mockRejectedValueOnce(error);

      await sut.run();

      expect(loggerStub.error).toHaveBeenCalledWith(
        'Routine execution failed',
        error.stack,
      );
    });

    it('should run again on the next tick after a rejection', async () => {
      const { sut, handlerStub } = makeSut();
      handlerStub.execute.mockRejectedValueOnce(new Error('any-message'));
      await sut.run();

      await sut.run();

      expect(handlerStub.execute).toHaveBeenCalledTimes(2);
    });

    it('should log to the console when no logger is given', async () => {
      const handlerStub = makeRoutineHandlerStub();
      const sut = new RoutineRunner('any-routine', handlerStub);
      const consoleError = vi.spyOn(console, 'error').mockReturnValueOnce();
      handlerStub.execute.mockRejectedValueOnce(new Error('any-message'));

      await sut.run();

      expect(consoleError).toHaveBeenCalledWith(
        '[Routine:any-routine] Routine execution failed',
        expect.stringContaining('any-message'),
      );
    });
  });
});

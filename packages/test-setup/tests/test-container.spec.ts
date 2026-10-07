import { describe, expect, it, vi } from 'vitest';

import { ContainerEvent, type ContainerHooks } from '../src';
import { FakeContainer } from './mocks/fake-container';

type SutTypes = {
  sut: FakeContainer;
  calls: string[];
};

const makeSut = (hooks?: ContainerHooks): SutTypes => {
  const sut = new FakeContainer({ hooks });
  const calls: string[] = [];

  sut.start.mockImplementation(async () => {
    calls.push('start');
  });
  sut.stop.mockImplementation(async () => {
    calls.push('stop');
  });

  return { sut, calls };
};

describe('TestContainer', () => {
  describe('init', () => {
    it('should start the container', async () => {
      const { sut } = makeSut();

      await sut.init();

      expect(sut.start).toHaveBeenCalledTimes(1);
    });

    it('should report running after starting', async () => {
      const { sut } = makeSut();

      await sut.init();

      expect(sut.isRunning).toBe(true);
    });

    it('should not start a running container again', async () => {
      const { sut } = makeSut();
      await sut.init();

      await sut.init();

      expect(sut.start).toHaveBeenCalledTimes(1);
    });

    it('should run start hooks around the start step, in order', async () => {
      const { sut, calls } = makeSut({
        beforeStart: [
          () => void calls.push('before-1'),
          () => void calls.push('before-2'),
        ],
        afterStart: () => void calls.push('after'),
      });

      await sut.init();

      expect(calls).toEqual(['before-1', 'before-2', 'start', 'after']);
    });

    it('should not report running when the start step fails', async () => {
      const { sut } = makeSut();
      sut.start.mockRejectedValueOnce(new Error('any-message'));

      const promise = sut.init();

      await expect(promise).rejects.toThrow('any-message');
      expect(sut.isRunning).toBe(false);
    });
  });

  describe('asyncDispose', () => {
    it('should not stop a container that is not running', async () => {
      const { sut } = makeSut();

      await sut[Symbol.asyncDispose]();

      expect(sut.stop).not.toHaveBeenCalled();
    });

    it('should report not running after stopping', async () => {
      const { sut } = makeSut();
      await sut.init();

      await sut[Symbol.asyncDispose]();

      expect(sut.isRunning).toBe(false);
    });

    it('should run stop hooks around the stop step, in order', async () => {
      const { sut, calls } = makeSut({
        beforeStop: () => void calls.push('before'),
        afterStop: () => void calls.push('after'),
      });
      await sut.init();

      await sut[Symbol.asyncDispose]();

      expect(calls).toEqual(['start', 'before', 'stop', 'after']);
    });

    it('should stop when used with await using', async () => {
      const { sut } = makeSut();

      {
        await using container = sut;
        await container.init();
      }

      expect(sut.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('on', () => {
    it('should run a hook registered for an event', async () => {
      const { sut } = makeSut();
      const hook = vi.fn();
      sut.on(ContainerEvent.AFTER_START, hook);

      await sut.init();

      expect(hook).toHaveBeenCalledTimes(1);
    });

    it('should return the container for chaining', () => {
      const { sut } = makeSut();

      const result = sut.on(ContainerEvent.BEFORE_START, () => {});

      expect(result).toBe(sut);
    });
  });
});

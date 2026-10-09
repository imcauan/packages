import webpush from 'web-push';

import { PushDeliveryGoneError } from '../../src';
import { WebPushSenderGateway } from '../../src/web-push';

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

const makeSut = (): WebPushSenderGateway =>
  new WebPushSenderGateway({
    publicKey: 'any-public-key',
    privateKey: 'any-private-key',
    subject: 'mailto:any@email.com',
  });

const params = {
  subscription: {
    endpoint: 'any-endpoint',
    p256dh: 'any-p256dh',
    auth: 'any-auth',
  },
  payload: { title: 'any-title', body: 'any-body' },
};

describe('WebPushSenderGateway', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call webpush.setVapidDetails with correct values', () => {
    makeSut();

    expect(webpush.setVapidDetails).toHaveBeenCalledWith(
      'mailto:any@email.com',
      'any-public-key',
      'any-private-key',
    );
  });

  describe('send', () => {
    it('should call webpush.sendNotification with correct values', async () => {
      const sut = makeSut();

      await sut.send(params);

      expect(webpush.sendNotification).toHaveBeenCalledWith(
        {
          endpoint: 'any-endpoint',
          keys: { p256dh: 'any-p256dh', auth: 'any-auth' },
        },
        '{"title":"any-title","body":"any-body"}',
      );
    });

    it.each([404, 410])(
      'should throw PushDeliveryGoneError when the push service answers %i',
      async statusCode => {
        const sut = makeSut();
        vi.mocked(webpush.sendNotification).mockRejectedValueOnce({
          statusCode,
        });

        const promise = sut.send(params);

        await expect(promise).rejects.toThrow(PushDeliveryGoneError);
      },
    );

    it('should rethrow any other error', async () => {
      const sut = makeSut();
      const error = new Error('any-message');
      vi.mocked(webpush.sendNotification).mockRejectedValueOnce(error);

      const promise = sut.send(params);

      await expect(promise).rejects.toBe(error);
    });
  });
});

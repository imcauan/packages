import {
  InvalidPushSubscriptionError,
  PushNotSupportedError,
  PushPermissionDeniedError,
} from '../../src';
import { WebPushGateway } from '../../src/browser';
import {
  makeBrowserPushStub,
  stubBrowserPush,
  stubNoPushSupport,
  type BrowserPushStub,
} from '../mocks/browser-push.stub';

type SutTypes = {
  sut: WebPushGateway;
  browserStub: BrowserPushStub;
};

const makeSut = (): SutTypes => {
  const browserStub = makeBrowserPushStub();
  stubBrowserPush(browserStub);
  const sut = new WebPushGateway({
    serviceWorkerUrl: '/any-sw.js',
    scope: '/any-scope',
  });

  return { sut, browserStub };
};

const subscription = {
  endpoint: 'any-endpoint',
  p256dh: 'any-p256dh',
  auth: 'any-auth',
};

describe('WebPushGateway (browser)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isSupported', () => {
    it('should return true when the Push API is available', () => {
      const { sut } = makeSut();

      const result = sut.isSupported();

      expect(result).toBe(true);
    });

    it('should return false when the Push API is missing', () => {
      const { sut } = makeSut();
      stubNoPushSupport();

      const result = sut.isSupported();

      expect(result).toBe(false);
    });
  });

  describe('getExistingSubscription', () => {
    it('should call serviceWorker.getRegistration with the service worker URL', async () => {
      const { sut, browserStub } = makeSut();

      await sut.getExistingSubscription();

      expect(browserStub.serviceWorker.getRegistration).toHaveBeenCalledWith(
        '/any-sw.js',
      );
    });

    it('should return the subscription as plain data', async () => {
      const { sut } = makeSut();

      const result = await sut.getExistingSubscription();

      expect(result).toEqual(subscription);
    });

    it('should return null when there is no subscription', async () => {
      const { sut, browserStub } = makeSut();
      browserStub.pushManager.getSubscription.mockResolvedValueOnce(null);

      const result = await sut.getExistingSubscription();

      expect(result).toBeNull();
    });

    it('should return null when push is not supported', async () => {
      const { sut } = makeSut();
      stubNoPushSupport();

      const result = await sut.getExistingSubscription();

      expect(result).toBeNull();
    });

    it('should throw InvalidPushSubscriptionError when the subscription has no keys', async () => {
      const { sut, browserStub } = makeSut();
      browserStub.pushSubscription.toJSON.mockReturnValueOnce({
        endpoint: 'any-endpoint',
      });

      const promise = sut.getExistingSubscription();

      await expect(promise).rejects.toThrow(InvalidPushSubscriptionError);
    });
  });

  describe('subscribe', () => {
    it('should call serviceWorker.register with correct values', async () => {
      const { sut, browserStub } = makeSut();

      await sut.subscribe('any-key');

      expect(browserStub.serviceWorker.register).toHaveBeenCalledWith(
        '/any-sw.js',
        { scope: '/any-scope' },
      );
    });

    it('should return the existing subscription instead of subscribing again', async () => {
      const { sut, browserStub } = makeSut();

      await sut.subscribe('any-key');

      expect(browserStub.pushManager.subscribe).not.toHaveBeenCalled();
    });

    it('should call pushManager.subscribe with the decoded key when there is no subscription', async () => {
      const { sut, browserStub } = makeSut();
      browserStub.pushManager.getSubscription.mockResolvedValueOnce(null);

      await sut.subscribe('AQID');

      expect(browserStub.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: new Uint8Array([1, 2, 3]),
      });
    });

    it('should decode URL-safe base64 keys without padding', async () => {
      const { sut, browserStub } = makeSut();
      browserStub.pushManager.getSubscription.mockResolvedValueOnce(null);

      await sut.subscribe('-_8');

      expect(browserStub.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: new Uint8Array([251, 255]),
      });
    });

    it('should return the new subscription as plain data', async () => {
      const { sut, browserStub } = makeSut();
      browserStub.pushManager.getSubscription.mockResolvedValueOnce(null);

      const result = await sut.subscribe('any-key');

      expect(result).toEqual(subscription);
    });

    it('should throw PushPermissionDeniedError when permission is not granted', async () => {
      const { sut, browserStub } = makeSut();
      browserStub.notification.requestPermission.mockResolvedValueOnce(
        'denied',
      );

      const promise = sut.subscribe('any-key');

      await expect(promise).rejects.toThrow(PushPermissionDeniedError);
    });

    it('should throw PushNotSupportedError when push is not supported', async () => {
      const { sut } = makeSut();
      stubNoPushSupport();

      const promise = sut.subscribe('any-key');

      await expect(promise).rejects.toThrow(PushNotSupportedError);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe the current subscription', async () => {
      const { sut, browserStub } = makeSut();

      await sut.unsubscribe();

      expect(browserStub.pushSubscription.unsubscribe).toHaveBeenCalledOnce();
    });

    it('should resolve when push is not supported', async () => {
      const { sut } = makeSut();
      stubNoPushSupport();

      const promise = sut.unsubscribe();

      await expect(promise).resolves.toBeUndefined();
    });
  });
});

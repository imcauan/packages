import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';

import { initTracing } from '../src';

vi.mock('@opentelemetry/sdk-node');
vi.mock('@opentelemetry/exporter-trace-otlp-http');
vi.mock('@opentelemetry/auto-instrumentations-node');
vi.mock('@opentelemetry/resources');

const makeSut = (): typeof initTracing => initTracing;

describe('initTracing', () => {
  beforeEach(() => {
    vi.mocked(NodeSDK.prototype.shutdown).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('without an otlpEndpoint', () => {
    it('should return undefined', () => {
      const sut = makeSut();

      const sdk = sut({ serviceName: 'any-service' });

      expect(sdk).toBeUndefined();
    });

    it('should not start the SDK', () => {
      const sut = makeSut();

      sut({ serviceName: 'any-service' });

      expect(NodeSDK).not.toHaveBeenCalled();
    });
  });

  describe('with an otlpEndpoint', () => {
    beforeEach(() => {
      vi.spyOn(process, 'on').mockReturnValue(process);
    });

    it('should export traces to the endpoint', () => {
      const sut = makeSut();

      sut({ serviceName: 'any-service', otlpEndpoint: 'any-endpoint' });

      expect(OTLPTraceExporter).toHaveBeenCalledWith({ url: 'any-endpoint' });
    });

    it('should report serviceName as service.name', () => {
      const sut = makeSut();

      sut({ serviceName: 'any-service', otlpEndpoint: 'any-endpoint' });

      expect(resourceFromAttributes).toHaveBeenCalledWith({
        'service.name': 'any-service',
      });
    });

    it('should start the SDK', () => {
      const sut = makeSut();

      const sdk = sut({
        serviceName: 'any-service',
        otlpEndpoint: 'any-endpoint',
      });

      expect(sdk?.start).toHaveBeenCalledOnce();
    });

    it('should return the SDK', () => {
      const sut = makeSut();

      const sdk = sut({
        serviceName: 'any-service',
        otlpEndpoint: 'any-endpoint',
      });

      expect(sdk).toBeInstanceOf(NodeSDK);
    });

    it('should listen for SIGTERM', () => {
      const sut = makeSut();
      const on = vi.spyOn(process, 'on').mockReturnValue(process);

      sut({ serviceName: 'any-service', otlpEndpoint: 'any-endpoint' });

      expect(on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    it('should shut the SDK down, then exit with 0, on SIGTERM', async () => {
      const sut = makeSut();
      const on = vi.spyOn(process, 'on').mockReturnValue(process);
      const exit = vi
        .spyOn(process, 'exit')
        .mockReturnValue(undefined as never);
      const sdk = sut({
        serviceName: 'any-service',
        otlpEndpoint: 'any-endpoint',
      });
      const onSigterm = on.mock.calls[0]?.[1] as () => void;

      onSigterm();

      await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
      expect(sdk?.shutdown).toHaveBeenCalledBefore(exit);
    });
  });
});

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';

vi.mock('@opentelemetry/sdk-node');
vi.mock('@opentelemetry/exporter-trace-otlp-http');
vi.mock('@opentelemetry/auto-instrumentations-node');
vi.mock('@opentelemetry/resources');

const importSut = async (): Promise<void> => {
  vi.resetModules();
  await import('../src/register');
};

describe('register', () => {
  beforeEach(() => {
    vi.spyOn(process, 'on').mockReturnValue(process);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should export traces to OTEL_EXPORTER_OTLP_ENDPOINT', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'any-endpoint');

    await importSut();

    expect(vi.mocked(OTLPTraceExporter)).toHaveBeenCalledWith({
      url: 'any-endpoint',
    });
  });

  it('should report OTEL_SERVICE_NAME as service.name', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'any-endpoint');
    vi.stubEnv('OTEL_SERVICE_NAME', 'any-service');

    await importSut();

    expect(vi.mocked(resourceFromAttributes)).toHaveBeenCalledWith({
      'service.name': 'any-service',
    });
  });

  it('should not start tracing without OTEL_EXPORTER_OTLP_ENDPOINT', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');

    await importSut();

    expect(vi.mocked(NodeSDK)).not.toHaveBeenCalled();
  });
});

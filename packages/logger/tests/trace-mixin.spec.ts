import { trace, type Span } from '@opentelemetry/api';

import { traceMixin } from '../src';

const makeSpan = (): Span =>
  trace.wrapSpanContext({
    traceId: '0af7651916cd43dd8448eb211c80319c',
    spanId: 'b7ad6b7169203331',
    traceFlags: 1,
  });

const makeSut = (): typeof traceMixin => traceMixin;

describe('traceMixin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the active trace and span ids', () => {
    const sut = makeSut();
    vi.spyOn(trace, 'getActiveSpan').mockReturnValueOnce(makeSpan());

    const fields = sut();

    expect(fields).toEqual({
      trace_id: '0af7651916cd43dd8448eb211c80319c',
      span_id: 'b7ad6b7169203331',
    });
  });

  it('should return no fields when there is no active span', () => {
    const sut = makeSut();

    const fields = sut();

    expect(fields).toEqual({});
  });
});

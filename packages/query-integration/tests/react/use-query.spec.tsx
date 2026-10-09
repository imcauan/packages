// @vitest-environment jsdom
import 'reflect-metadata';

import { createInjectionToken } from '@imcauan/dependency-injection';
import { renderHook, waitFor } from '@testing-library/react';

import { QueryOptions } from '../../src';
import { useQuery } from '../../src/react';
import { makeHarness } from './wrapper';

type Product = { id: string; name: string };

interface ILoadProduct {
  execute(id: string): Promise<Product>;
}
const LoadProduct = createInjectionToken<ILoadProduct>('LoadProduct');

@QueryOptions({ queryKey: (id: string) => ['products', id] })
class LoadProductStub implements ILoadProduct {
  execute = vi.fn((id: string) => Promise.resolve({ id, name: 'any-name' }));
}

interface IListProducts {
  execute(): Promise<Product[]>;
}
const ListProducts = createInjectionToken<IListProducts>('ListProducts');

@QueryOptions({ queryKey: ['products'] })
class ListProductsStub implements IListProducts {
  execute = vi.fn().mockResolvedValue([]);
}

const makeSut = () => {
  const loadProduct = new LoadProductStub();
  const listProducts = new ListProductsStub();
  const harness = makeHarness([
    { provide: LoadProduct, useValue: loadProduct },
    { provide: ListProducts, useValue: listProducts },
  ]);

  return { ...harness, loadProduct, listProducts };
};

describe('useQuery', () => {
  it('should call execute with params', async () => {
    const { wrapper, loadProduct } = makeSut();

    renderHook(() => useQuery({ token: LoadProduct, params: 'any-id' }), {
      wrapper,
    });

    await waitFor(() =>
      expect(loadProduct.execute).toHaveBeenCalledWith('any-id'),
    );
  });

  it('should return what execute resolves', async () => {
    const { wrapper } = makeSut();

    const { result } = renderHook(
      () => useQuery({ token: LoadProduct, params: 'any-id' }),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.data).toEqual({ id: 'any-id', name: 'any-name' }),
    );
  });

  it('should call execute without arguments when it takes none', async () => {
    const { wrapper, listProducts } = makeSut();

    renderHook(() => useQuery({ token: ListProducts }), { wrapper });

    await waitFor(() => expect(listProducts.execute).toHaveBeenCalledWith());
  });

  it('should cache the result under the key resolved from params', async () => {
    const { wrapper, queryClient } = makeSut();

    const { result } = renderHook(
      () => useQuery({ token: LoadProduct, params: 'any-id' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(['products', 'any-id'])).toEqual({
      id: 'any-id',
      name: 'any-name',
    });
  });

  it("should prefer the hook's queryKey to the class's", async () => {
    const { wrapper, queryClient } = makeSut();

    const { result } = renderHook(
      () => useQuery({ token: ListProducts, queryKey: ['any-key'] }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(['any-key'])).toEqual([]);
  });

  it("should call the class's onError, then the hook's, when execute rejects", async () => {
    const calls: string[] = [];
    @QueryOptions({ queryKey: ['any-key'], onError: () => calls.push('class') })
    class FailingQuery implements IListProducts {
      execute = vi.fn().mockRejectedValue(new Error('any-message'));
    }
    const { wrapper } = makeHarness([
      { provide: ListProducts, useValue: new FailingQuery() },
    ]);

    renderHook(
      () =>
        useQuery({ token: ListProducts, onError: () => calls.push('hook') }),
      { wrapper },
    );

    await waitFor(() => expect(calls).toEqual(['class', 'hook']));
  });

  it('should throw when no queryKey is configured', () => {
    class NoKeyQuery implements IListProducts {
      execute = vi.fn().mockResolvedValue([]);
    }
    const { wrapper } = makeHarness([
      { provide: ListProducts, useValue: new NoKeyQuery() },
    ]);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const render = () =>
      renderHook(() => useQuery({ token: ListProducts }), { wrapper });

    expect(render).toThrow(/No queryKey was configured for ListProducts/);
  });

  it('should type params and data from execute', () => {
    expectTypeOf(useQuery<ILoadProduct>)
      .parameter(0)
      .toHaveProperty('params')
      .toEqualTypeOf<string>();
    expectTypeOf(useQuery<ILoadProduct>)
      .returns.toHaveProperty('data')
      .toEqualTypeOf<Product | undefined>();
  });
});

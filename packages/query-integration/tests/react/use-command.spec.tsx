// @vitest-environment jsdom
import { createInjectionToken } from '@imcauan/dependency-injection';
import { act, renderHook, waitFor } from '@testing-library/react';

import { CommandOptions } from '../../src';
import { useCommand } from '../../src/react';
import { makeHarness } from './wrapper';

type NewProduct = { name: string };
type Product = { id: string; name: string };

interface ICreateProduct {
  execute(input: NewProduct): Promise<Product>;
}
const CreateProduct = createInjectionToken<ICreateProduct>('CreateProduct');

const makeCreateProductStub = (
  options: Parameters<typeof CommandOptions>[0],
) => {
  @CommandOptions(options)
  class CreateProductStub implements ICreateProduct {
    execute = vi.fn((input: NewProduct) =>
      Promise.resolve({ id: 'any-id', name: input.name }),
    );
  }
  return new CreateProductStub();
};

const makeSut = (options: Parameters<typeof CommandOptions>[0] = {}) => {
  const createProduct = makeCreateProductStub(options);
  const harness = makeHarness([
    { provide: CreateProduct, useValue: createProduct },
  ]);

  return { ...harness, createProduct };
};

describe('useCommand', () => {
  it('should call execute with the variables', async () => {
    const { wrapper, createProduct } = makeSut();
    const { result } = renderHook(() => useCommand({ token: CreateProduct }), {
      wrapper,
    });

    act(() => result.current.mutate({ name: 'any-name' }));

    await waitFor(() =>
      expect(createProduct.execute).toHaveBeenCalledWith({ name: 'any-name' }),
    );
  });

  it('should invalidate the configured query keys on success', async () => {
    const { wrapper, queryClient } = makeSut({ invalidates: [['products']] });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCommand({ token: CreateProduct }), {
      wrapper,
    });

    act(() => result.current.mutate({ name: 'any-name' }));

    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['products'],
      }),
    );
  });

  it('should call an invalidation function with the variables and result', async () => {
    const invalidates = vi.fn().mockReturnValue([]);
    const { wrapper } = makeSut({ invalidates });
    const { result } = renderHook(() => useCommand({ token: CreateProduct }), {
      wrapper,
    });

    act(() => result.current.mutate({ name: 'any-name' }));

    await waitFor(() =>
      expect(invalidates).toHaveBeenCalledWith({
        variables: { name: 'any-name' },
        result: { id: 'any-id', name: 'any-name' },
      }),
    );
  });

  it("should call the class's onSuccess, then the hook's", async () => {
    const calls: string[] = [];
    const { wrapper } = makeSut({ onSuccess: () => calls.push('class') });
    const { result } = renderHook(
      () =>
        useCommand({
          token: CreateProduct,
          onSuccess: () => calls.push('hook'),
        }),
      { wrapper },
    );

    act(() => result.current.mutate({ name: 'any-name' }));

    await waitFor(() => expect(calls).toEqual(['class', 'hook']));
  });

  it('should type variables and result from execute', () => {
    expectTypeOf(useCommand<ICreateProduct>)
      .returns.toHaveProperty('mutate')
      .parameter(0)
      .toEqualTypeOf<NewProduct>();
    expectTypeOf(useCommand<ICreateProduct>)
      .returns.toHaveProperty('data')
      .toEqualTypeOf<Product | undefined>();
  });
});

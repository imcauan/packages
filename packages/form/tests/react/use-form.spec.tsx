// @vitest-environment jsdom
import { v } from '@imcauan/validation';
import { act, renderHook } from '@testing-library/react';

import { useForm } from '../../src/react';

const schema = v.object({
  name: v.string().min({ value: 3, error: 'name_too_short' }),
  address: v.object({
    city: v.string().min({ value: 2, error: 'city_too_short' }),
  }),
});

const makeSut = () =>
  renderHook(() => {
    const form = useForm({
      schema,
      defaultValues: { name: 'a', address: { city: 'b' } },
    });
    // react-hook-form re-renders only for the formState fields read in render.
    void form.formState.errors;
    return form;
  });

describe('useForm', () => {
  it('should report invalid fields after validation', async () => {
    const { result } = makeSut();

    await act(() => result.current.trigger());

    expect(result.current.formState.errors.name?.message).toBe(
      'name_too_short',
    );
  });

  it('should report invalid nested fields', async () => {
    const { result } = makeSut();

    await act(() => result.current.trigger());

    expect(result.current.formState.errors.address?.city?.message).toBe(
      'city_too_short',
    );
  });

  it('should submit the values once they are valid', async () => {
    const { result } = makeSut();
    const onValid = vi.fn();
    act(() => {
      result.current.setValue('name', 'any-name');
      result.current.setValue('address.city', 'any-city');
    });

    await act(() => result.current.handleSubmit(onValid)());

    expect(onValid).toHaveBeenCalledWith(
      { name: 'any-name', address: { city: 'any-city' } },
      undefined,
    );
  });
});

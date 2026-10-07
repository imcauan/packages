import { describe, expectTypeOf, it } from 'vitest';

import { v, type Infer } from '../src';

const makeSut = (): typeof v => v;

describe('Infer', () => {
  it('should infer an object type from its field schemas', () => {
    const sut = makeSut();

    const schema = sut.object({
      name: sut.string(),
      age: sut.number().optional(),
      active: sut.boolean().default(false),
      role: sut.oneOf(['any-a', 'any-b'] as const),
    });

    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<{
      name: string;
      age: number | undefined;
      active: boolean;
      role: 'any-a' | 'any-b';
    }>();
  });
});

import 'reflect-metadata';

import {
  CommandOptions,
  getCommandOptions,
  getQueryOptions,
  QueryOptions,
} from '../src';

describe('QueryOptions', () => {
  it('should store the options on the class', () => {
    @QueryOptions({ queryKey: ['any-key'], staleTime: 1000 })
    class AnyQuery {}

    const options = getQueryOptions(AnyQuery);

    expect(options).toEqual({ queryKey: ['any-key'], staleTime: 1000 });
  });
});

describe('CommandOptions', () => {
  it('should store the options on the class', () => {
    @CommandOptions({ mutationKey: ['any-key'], invalidates: [['any-key']] })
    class AnyCommand {}

    const options = getCommandOptions(AnyCommand);

    expect(options).toEqual({
      mutationKey: ['any-key'],
      invalidates: [['any-key']],
    });
  });
});

describe('getQueryOptions', () => {
  it('should read the options from an instance', () => {
    @QueryOptions({ queryKey: ['any-key'] })
    class AnyQuery {}

    const options = getQueryOptions(new AnyQuery());

    expect(options).toEqual({ queryKey: ['any-key'] });
  });

  it('should inherit the options of a base class', () => {
    @QueryOptions({ queryKey: ['any-key'] })
    class BaseQuery {}
    class AnyQuery extends BaseQuery {}

    const options = getQueryOptions(AnyQuery);

    expect(options).toEqual({ queryKey: ['any-key'] });
  });

  it("should prefer a subclass's own options", () => {
    @QueryOptions({ queryKey: ['base-key'] })
    class BaseQuery {}
    @QueryOptions({ queryKey: ['own-key'] })
    class AnyQuery extends BaseQuery {}

    const options = getQueryOptions(AnyQuery);

    expect(options).toEqual({ queryKey: ['own-key'] });
  });

  it('should return undefined for a class without options', () => {
    class AnyQuery {}

    const options = getQueryOptions(AnyQuery);

    expect(options).toBeUndefined();
  });
});

describe('getCommandOptions', () => {
  it('should return undefined for a class without options', () => {
    class AnyCommand {}

    const options = getCommandOptions(new AnyCommand());

    expect(options).toBeUndefined();
  });
});

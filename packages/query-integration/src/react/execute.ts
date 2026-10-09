import type { Executable, ExecuteParams, ExecuteResult } from '..';

/** Calls `executable.execute(params)`, or `executable.execute()` when `params` is undefined. */
export function execute<TExecutable extends Executable>(
  executable: TExecutable,
  params: ExecuteParams<TExecutable> | undefined,
): Promise<ExecuteResult<TExecutable>> {
  // `params` is undefined exactly when `execute` takes no arguments.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const args = (params === undefined ? [] : [params]) as Parameters<
    TExecutable['execute']
  >;

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the awaited return type of `execute`
  return Promise.resolve(executable.execute(...args)) as Promise<
    ExecuteResult<TExecutable>
  >;
}

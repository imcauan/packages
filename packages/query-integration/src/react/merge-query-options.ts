import type { Executable, ExecutableQueryMetadata } from '..';
import { composeCallbacks } from './compose-callbacks';

export function mergeQueryOptions<
  TExecutable extends Executable,
  TError,
  TSelectedData,
>(
  metadata:
    | ExecutableQueryMetadata<TExecutable, TError, TSelectedData>
    | undefined,
  localOptions: ExecutableQueryMetadata<TExecutable, TError, TSelectedData>,
): ExecutableQueryMetadata<TExecutable, TError, TSelectedData> {
  type Metadata = ExecutableQueryMetadata<TExecutable, TError, TSelectedData>;
  const metadataOptions = metadata ?? {};

  return {
    ...metadataOptions,
    ...localOptions,
    onError: composeCallbacks<Parameters<NonNullable<Metadata['onError']>>>(
      metadataOptions.onError,
      localOptions.onError,
    ),
  };
}

import type { UseMutationOptions } from '@tanstack/react-query';
import type { CommandMetadata } from '..';
import { composeCallbacks } from './compose-callbacks';

export function mergeCommandOptions<TResult, TError, TVariables, TContext>(
  metadata: CommandMetadata<TResult, TError, TVariables, TContext> | undefined,
  localOptions: CommandMetadata<TResult, TError, TVariables, TContext>,
): CommandMetadata<TResult, TError, TVariables, TContext> {
  type Metadata = CommandMetadata<TResult, TError, TVariables, TContext>;
  const metadataOptions = metadata ?? {};

  return {
    ...metadataOptions,
    ...localOptions,
    onMutate: composeAsyncCallbacks(
      metadataOptions.onMutate,
      localOptions.onMutate,
    ),
    onSuccess: composeCallbacks<Parameters<NonNullable<Metadata['onSuccess']>>>(
      metadataOptions.onSuccess,
      localOptions.onSuccess,
    ),
    onError: composeCallbacks<Parameters<NonNullable<Metadata['onError']>>>(
      metadataOptions.onError,
      localOptions.onError,
    ),
    onSettled: composeCallbacks<Parameters<NonNullable<Metadata['onSettled']>>>(
      metadataOptions.onSettled,
      localOptions.onSettled,
    ),
  };
}

function composeAsyncCallbacks<TResult, TError, TVariables, TContext>(
  metadataCallback:
    | UseMutationOptions<TResult, TError, TVariables, TContext>['onMutate']
    | undefined,
  localCallback:
    | UseMutationOptions<TResult, TError, TVariables, TContext>['onMutate']
    | undefined,
): UseMutationOptions<TResult, TError, TVariables, TContext>['onMutate'] {
  if (!metadataCallback) {
    return localCallback;
  }

  if (!localCallback) {
    return metadataCallback;
  }

  return async (variables, context) => {
    await metadataCallback(variables, context);
    return localCallback(variables, context);
  };
}

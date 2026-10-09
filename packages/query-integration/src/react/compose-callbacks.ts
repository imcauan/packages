/** Composes two optional callbacks of the same shape into one that calls both in order. */
export function composeCallbacks<TArgs extends unknown[]>(
  metadataCallback: ((...args: TArgs) => unknown) | undefined,
  localCallback: ((...args: TArgs) => unknown) | undefined,
): ((...args: TArgs) => unknown) | undefined {
  if (!metadataCallback) {
    return localCallback;
  }

  if (!localCallback) {
    return metadataCallback;
  }

  return (...args: TArgs) => {
    metadataCallback(...args);
    return localCallback(...args);
  };
}

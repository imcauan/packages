import { openSync } from 'node:fs';
import { ReadStream, WriteStream } from 'node:tty';

/** The user's terminal, reached through /dev/tty. */
export type Terminal = {
  input: ReadStream;
  output: WriteStream;
  close(): void;
};

/**
 * Opens /dev/tty. A pre-push hook's stdin carries git's ref list, so prompts
 * can't read from it. Returns undefined when there's no terminal: GUI git
 * clients, CI, agents.
 */
export function openTerminal(): Terminal | undefined {
  try {
    const input = new ReadStream(openSync('/dev/tty', 'r'));
    const output = new WriteStream(openSync('/dev/tty', 'w'));
    return {
      input,
      output,
      close: () => {
        input.destroy();
        output.destroy();
      },
    };
  } catch {
    return undefined;
  }
}

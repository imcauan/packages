import { Writable } from 'node:stream';

/** An output stream that keeps everything written to it; not a TTY by default. */
export class MemoryOutput extends Writable {
  readonly isTTY: boolean;
  readonly columns = 72;
  private readonly chunks: string[] = [];

  constructor({ isTTY = false }: { isTTY?: boolean } = {}) {
    super();
    this.isTTY = isTTY;
  }

  override _write(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    done: () => void,
  ): void {
    this.chunks.push(chunk.toString());
    done();
  }

  get text(): string {
    return this.chunks.join('');
  }
}

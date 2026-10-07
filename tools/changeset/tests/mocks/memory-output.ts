import { Writable } from 'node:stream';

/** A non-TTY output stream that keeps everything written to it. */
export class MemoryOutput extends Writable {
  readonly isTTY = false;
  readonly columns = 72;
  private readonly chunks: string[] = [];

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

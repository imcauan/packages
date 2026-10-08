import type { Writable } from 'node:stream';

import type { NextStep } from '../errors.ts';
import { alignRight, formatDuration, padEnd } from './text.ts';
import type { Theme } from './theme.ts';

const SPINNER_FRAMES = ['◒', '◐', '◓', '◑'];
const SPINNER_INTERVAL_MS = 80;
const MAX_WIDTH = 72;

type ReporterOptions = {
  output: Writable & { isTTY?: boolean; columns?: number };
  theme: Theme;
  /** Milliseconds since some origin; injectable for tests. */
  now?: () => number;
};

export type StepDetails = {
  /** Secondary info, dimmed after a ` · `. */
  detail?: string;
  /** Shown right-aligned and dimmed. */
  durationMs?: number;
};

/** A failure to report: what failed, why, and what to do next. */
export type ReportedError = {
  what: string;
  why: string;
  next: readonly NextStep[];
  stack?: string;
};

/**
 * Draws the clack-style rail: `┌` to open, `│` between steps, `◇` for
 * finished steps (with their duration), `└` to close.
 */
export class Reporter {
  private readonly output: ReporterOptions['output'];
  private readonly theme: Theme;
  private readonly now: () => number;
  readonly width: number;
  private lastLineWasRail = false;

  constructor({
    output,
    theme,
    now = () => performance.now(),
  }: ReporterOptions) {
    this.output = output;
    this.theme = theme;
    this.now = now;
    this.width = Math.min(output.columns ?? MAX_WIDTH, MAX_WIDTH);
  }

  /** The single dim line printed when the step has nothing to do. */
  skip(reason: string): void {
    this.write(this.theme.dim(`◇  changeset · skipped: ${reason}`));
  }

  header(): void {
    const { badge, dim } = this.theme;
    this.write(
      `${dim('┌')}  ${badge(' imcauan ')} changeset ${dim('pre-push')}`,
    );
  }

  step(label: string, details: StepDetails = {}): void {
    this.rail();
    this.write(this.stepLine(this.theme.success('◇'), label, details));
  }

  /**
   * Runs `work` behind a spinner, then prints it as a finished step. `work`
   * can report progress; the spinner line shows it with the elapsed time.
   */
  async task<T>(
    label: string,
    work: (progress: (detail: string) => void) => Promise<T>,
    describe: (result: T) => Omit<StepDetails, 'durationMs'> = () => ({}),
  ): Promise<T> {
    this.rail();
    const startedAt = this.now();
    const spinner = this.spin(label, startedAt);

    try {
      const result = await work(spinner.update);
      spinner.stop();
      this.write(
        this.stepLine(this.theme.success('◇'), label, {
          ...describe(result),
          durationMs: this.now() - startedAt,
        }),
      );
      return result;
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  /** Lines indented under the rail, such as the changeset box. */
  block(lines: readonly string[]): void {
    this.rail();
    for (const line of lines) {
      this.write(`${this.theme.dim('│')}  ${line}`);
    }
  }

  warn(message: string): void {
    this.rail();
    this.write(`${this.theme.warning('▲')}  ${message}`);
  }

  end(message: string): void {
    this.rail();
    this.write(`${this.theme.dim('└')}  ${message}`);
  }

  error({ what, why, next, stack }: ReportedError): void {
    const { danger, dim } = this.theme;
    const commandWidth = Math.max(...next.map(step => step.command.length));

    this.rail();
    this.write(`${danger('■')}  ${danger(what)}`);
    this.write(`${dim('│')}  ${why}`);
    if (next.length > 0) {
      this.rail();
      this.write(`${dim('│')}  What to do next:`);
      for (const step of next) {
        this.write(
          `${dim('│')}    ${padEnd(step.command, commandWidth)}  ${dim(step.description)}`,
        );
      }
    }
    if (stack) {
      this.rail();
      for (const line of stack.split('\n')) {
        this.write(`${dim('│')}  ${dim(line)}`);
      }
    }
    this.rail();
    this.write(`${dim('└')}  Push stopped.`);
  }

  private stepLine(
    symbol: string,
    label: string,
    { detail, durationMs }: StepDetails,
  ): string {
    const { dim } = this.theme;
    const left = `${symbol}  ${label}${detail ? dim(` · ${detail}`) : ''}`;
    return durationMs === undefined
      ? left
      : alignRight(left, dim(formatDuration(durationMs)), this.width);
  }

  private spin(
    label: string,
    startedAt: number,
  ): { update: (detail: string) => void; stop: () => void } {
    if (!this.output.isTTY) {
      return { update: () => {}, stop: () => {} };
    }

    const { accent, dim } = this.theme;
    let frame = 0;
    let detail = '';
    const draw = () => {
      const symbol = accent(
        SPINNER_FRAMES[frame % SPINNER_FRAMES.length] ?? '◒',
      );
      const left = `${symbol}  ${accent(label)}${detail ? dim(` · ${detail}`) : ''}`;
      const elapsed = dim(formatDuration(this.now() - startedAt));
      this.output.write(`\r\x1b[2K${alignRight(left, elapsed, this.width)}`);
      frame += 1;
    };
    draw();
    const timer = setInterval(draw, SPINNER_INTERVAL_MS);

    return {
      update: next => {
        detail = next;
        draw();
      },
      stop: () => {
        clearInterval(timer);
        this.output.write('\r\x1b[2K');
      },
    };
  }

  /** A rail line, unless the previous line already was one. */
  private rail(): void {
    if (!this.lastLineWasRail) {
      this.write(this.theme.dim('│'));
      this.lastLineWasRail = true;
    }
  }

  private write(line: string): void {
    this.output.write(`${line}\n`);
    this.lastLineWasRail = false;
  }
}

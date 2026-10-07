// oxlint-disable-next-line no-control-regex -- matches ANSI escape codes
const ANSI = /\x1b\[[0-9;]*m/g;

/** Visible width of `text`, ignoring color codes. */
export const visibleLength = (text: string): number =>
  text.replace(ANSI, '').length;

/** `left` and `right` on one line of `width` columns, `right` flush right. */
export function alignRight(left: string, right: string, width: number): string {
  const gap = Math.max(1, width - visibleLength(left) - visibleLength(right));
  return `${left}${' '.repeat(gap)}${right}`;
}

/** Pads `text` with spaces to `width` visible columns. */
export const padEnd = (text: string, width: number): string =>
  `${text}${' '.repeat(Math.max(0, width - visibleLength(text)))}`;

/** `830ms`, `2.4s`. */
export function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

/** Wraps `text` on spaces so no line is longer than `width`. */
export function wrap(text: string, width: number): string[] {
  return text.split('\n').flatMap(paragraph => {
    const lines: string[] = [];
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && line.length + 1 + word.length > width) {
        lines.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    lines.push(line);
    return lines;
  });
}

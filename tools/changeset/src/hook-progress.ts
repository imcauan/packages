// oxlint-disable-next-line no-control-regex -- matches ANSI escape codes
const ANSI = /\x1b\[[0-9;]*m/g;

/**
 * The script a pnpm or npm run banner announces, such as `lint` in
 * `> my-repo@1.0.0 lint /path` (pnpm leaves the version empty: `my-repo@`).
 * The pre-push hook runs one script per check, so this tells which check is
 * running. Returns undefined for any other line.
 */
export function scriptFromBanner(line: string): string | undefined {
  const match = /^> \S+@\S* ([\w:.-]+)(?:\s|$)/.exec(
    line.replace(ANSI, '').trim(),
  );
  return match?.[1];
}

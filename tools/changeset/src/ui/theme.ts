import { createColors } from 'picocolors';

type Paint = (text: string) => string;

export type Theme = {
  /** The brand accent (#7CC4FA): active steps and spinners. */
  accent: Paint;
  /** Completed steps (#5FD38D). */
  success: Paint;
  /** `minor` bumps and warnings (#F5B85C). */
  warning: Paint;
  /** `major` bumps and errors, in bold. */
  danger: Paint;
  /** Secondary text and the rail. */
  dim: Paint;
  bold: Paint;
  /** Dark text on the accent color. */
  badge: Paint;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const foreground = (hex: string): Paint => {
  const [r, g, b] = hexToRgb(hex);
  return text => `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
};

const background = (hex: string): Paint => {
  const [r, g, b] = hexToRgb(hex);
  return text => `\x1b[48;2;${r};${g};${b}m${text}\x1b[49m`;
};

const plain: Paint = text => text;

/**
 * Colors for a dark terminal. With `color: false` every paint function returns
 * its text unchanged, so output stays readable when piped or under NO_COLOR.
 */
export function createTheme({ color }: { color: boolean }): Theme {
  if (!color) {
    return {
      accent: plain,
      success: plain,
      warning: plain,
      danger: plain,
      dim: plain,
      bold: plain,
      badge: plain,
    };
  }

  const pc = createColors(true);
  const danger = foreground('#F47067');

  return {
    accent: foreground('#7CC4FA'),
    success: foreground('#5FD38D'),
    warning: foreground('#F5B85C'),
    danger: text => pc.bold(danger(text)),
    dim: pc.dim,
    bold: pc.bold,
    badge: text => background('#7CC4FA')(foreground('#0B1220')(pc.bold(text))),
  };
}

/** Colors are on when the output is a terminal and NO_COLOR isn't set. */
export function supportsColor(
  output: { isTTY?: boolean },
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  return Boolean(output.isTTY) && !env.NO_COLOR;
}

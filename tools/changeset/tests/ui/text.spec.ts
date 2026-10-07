import { describe, expect, it } from 'vitest';

import {
  alignRight,
  formatDuration,
  visibleLength,
  wrap,
} from '../../src/ui/text.ts';

describe('text helpers', () => {
  it('should ignore color codes when measuring', () => {
    const sut = visibleLength;

    const length = sut('\x1b[32many-text\x1b[39m');

    expect(length).toBe(8);
  });

  it('should push the right text to the last column', () => {
    const sut = alignRight;

    const line = sut('left', 'right', 12);

    expect(line).toBe('left   right');
  });

  it('should keep one space when the texts do not fit', () => {
    const sut = alignRight;

    const line = sut('left', 'right', 4);

    expect(line).toBe('left right');
  });

  it.each([
    [830, '830ms'],
    [2400, '2.4s'],
  ])('should format %ims as %s', (ms, expected) => {
    const sut = formatDuration;

    const text = sut(ms);

    expect(text).toBe(expected);
  });

  it('should wrap text on spaces', () => {
    const sut = wrap;

    const lines = sut('any words wrapped here', 10);

    expect(lines).toEqual(['any words', 'wrapped', 'here']);
  });

  it('should keep line breaks', () => {
    const sut = wrap;

    const lines = sut('any-first\nany-second', 40);

    expect(lines).toEqual(['any-first', 'any-second']);
  });
});

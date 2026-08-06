import { describe, expect, test } from 'bun:test';
import { media, mediumColor, mediumIds, mediumStyles, readMedium } from '../src/scene/model.js';

describe('process media', () => {
  test('every medium owns a namespaced custom property', () => {
    for (const id of mediumIds) {
      expect(media[id].variable).toBe(`--elements-medium-${id}`);
      expect(media[id].color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  test('normalizes unknown substances away', () => {
    expect(readMedium('oil')).toBe('oil');
    expect(readMedium('unobtainium')).toBeUndefined();
    expect(readMedium(null)).toBeUndefined();
  });

  test('colours fall back to the built-in value', () => {
    expect(mediumColor('water')).toBe('var(--elements-medium-water, #59d8ff)');
  });

  test('generates one rule per medium for a caller-supplied selector', () => {
    const css = mediumStyles((id) => `.pipe[data-medium="${id}"]`, (color) => `stroke:${color}`);
    expect(css.split('}').filter(Boolean)).toHaveLength(mediumIds.length);
    expect(css).toContain('.pipe[data-medium="steam"]{stroke:var(--elements-medium-steam, #d9e8f2)}');
  });
});

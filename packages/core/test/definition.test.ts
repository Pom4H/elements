import { describe, expect, test } from 'bun:test';
import { initialViewBox, resolveViewBox, viewBox } from '../src/definition.js';
import type { ElementContext } from '../src/types.js';

const context = {
  host: {} as HTMLElement,
  attributes: { modules: 4 },
  states: {},
} satisfies ElementContext;

describe('viewBox definitions', () => {
  test('keeps static view boxes unchanged', () => {
    expect(initialViewBox('0 0 320 240')).toBe('0 0 320 240');
    expect(resolveViewBox('0 0 320 240', context)).toBe('0 0 320 240');
  });

  test('resolves dynamic view boxes from element context', () => {
    const definition = viewBox('0 0 320 240', ({ attributes }) => `0 0 ${Number(attributes.modules) * 100} 240`);
    expect(initialViewBox(definition)).toBe('0 0 320 240');
    expect(resolveViewBox(definition, context)).toBe('0 0 400 240');
  });

  test('rejects invalid dimensions', () => {
    expect(() => initialViewBox('0 0 0 240')).toThrow(TypeError);
    expect(() => initialViewBox('0 0 auto 240')).toThrow(TypeError);
  });
});

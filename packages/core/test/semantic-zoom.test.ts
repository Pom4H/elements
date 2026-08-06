import { describe, expect, test } from 'bun:test';
import {
  semanticZoomLevels,
  semanticZoomStyles,
  stepSemanticZoom,
} from '../src/semantic-zoom.js';

describe('semantic zoom', () => {
  test('steps through abstraction levels and clamps at both ends', () => {
    expect(semanticZoomLevels).toEqual(['symbol', 'process', 'operational', 'diagnostic']);
    expect(stepSemanticZoom('symbol', 1)).toBe('process');
    expect(stepSemanticZoom('process', 1)).toBe('operational');
    expect(stepSemanticZoom('operational', -1)).toBe('process');
    expect(stepSemanticZoom('symbol', -1)).toBe('symbol');
    expect(stepSemanticZoom('diagnostic', 1)).toBe('diagnostic');
  });

  test('generates cumulative layer visibility rules', () => {
    const css = semanticZoomStyles();
    expect(css).toContain(':host([abstraction="symbol"]) [data-zoom-layer="symbol"]');
    expect(css).toContain(':host([abstraction="operational"]) [data-zoom-layer="process"]');
    expect(css).toContain(':host([abstraction="diagnostic"]) [data-zoom-layer="diagnostic"]');
  });

  test('rejects unsafe attribute names', () => {
    expect(() => semanticZoomStyles('data value')).toThrow(TypeError);
  });
});

import { describe, expect, test } from 'bun:test';
import { resolveDetailLevel } from '../src/definition.js';
import { detailModeStyles } from '../src/detail.js';

const breakpoints = { symbol: 132, compact: 200 };

describe('resolving a detail level', () => {
  test('an explicit detail wins over any measurement', () => {
    expect(resolveDetailLevel('full', 40, breakpoints)).toBe('full');
    expect(resolveDetailLevel('compact', 900, breakpoints)).toBe('compact');
    expect(resolveDetailLevel('symbol', 900, breakpoints)).toBe('symbol');
  });

  test('auto asks the measured width', () => {
    expect(resolveDetailLevel('auto', 96, breakpoints)).toBe('symbol');
    expect(resolveDetailLevel('auto', 132, breakpoints)).toBe('symbol');
    expect(resolveDetailLevel('auto', 133, breakpoints)).toBe('compact');
    expect(resolveDetailLevel('auto', 200, breakpoints)).toBe('compact');
    expect(resolveDetailLevel('auto', 201, breakpoints)).toBe('full');
    expect(resolveDetailLevel(null, 96, breakpoints)).toBe('symbol');
  });

  test('stays at full without breakpoints or before layout', () => {
    expect(resolveDetailLevel('auto', 40, undefined)).toBe('full');
    expect(resolveDetailLevel('auto', 0, breakpoints)).toBe('full');
  });

  test('a half-declared set only answers for the level it declares', () => {
    expect(resolveDetailLevel('auto', 96, { compact: 200 })).toBe('compact');
    expect(resolveDetailLevel('auto', 96, { symbol: 132 })).toBe('symbol');
    expect(resolveDetailLevel('auto', 300, { symbol: 132 })).toBe('full');
  });

  test('the resolved level sheds the same parts as a declared one', () => {
    expect(detailModeStyles).toContain(':host([data-detail-level="compact"]) [data-detail="fine"]');
    expect(detailModeStyles).toContain(':host([data-detail-level="symbol"]) [data-detail]');
  });
});

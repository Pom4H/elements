import { describe, expect, test } from 'bun:test';
import {
  connectionVisualMetrics,
  parseEndpointReference,
  readConnectionDiameter,
  readConnectionKind,
  readConnectionSpeed,
  readFlowDirection,
} from '../src/scene/model.js';

describe('scene connection model', () => {
  test('parses element and port references', () => {
    expect(parseEndpointReference('pump-1:out')).toEqual({ elementId: 'pump-1', portId: 'out' });
    expect(parseEndpointReference(' pump-1 : inlet ')).toEqual({ elementId: 'pump-1', portId: 'inlet' });
    expect(parseEndpointReference('missing-port')).toBeUndefined();
    expect(parseEndpointReference(':out')).toBeUndefined();
  });

  test('normalizes connection controls', () => {
    expect(readConnectionKind('wire')).toBe('wire');
    expect(readConnectionKind('unknown')).toBe('pipe');
    expect(readFlowDirection('reverse')).toBe('reverse');
    expect(readFlowDirection('sideways')).toBe('forward');
    expect(readConnectionSpeed('12')).toBe(8);
    expect(readConnectionSpeed('-2')).toBe(0);
    expect(readConnectionDiameter('pipe', null)).toBe(16);
    expect(readConnectionDiameter('pipe', '3')).toBe(8);
  });

  test('keeps the liquid channel inside the pipe shell', () => {
    const metrics = connectionVisualMetrics('pipe', 20);
    expect(metrics.outerWidth).toBe(20);
    expect(metrics.innerWidth).toBeLessThan(metrics.outerWidth);
    expect(metrics.flowWidth).toBeLessThan(metrics.innerWidth);
    expect(metrics.cycle).toBe(metrics.dash + metrics.gap);
  });
});

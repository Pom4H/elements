import { describe, expect, test } from 'bun:test';
import { pointsToRoundedPath, routeOrthogonal, simplifyOrthogonalPoints } from '../src/routing/index.js';

describe('orthogonal routing', () => {
  test('creates a forward Z route between opposite horizontal ports', () => {
    const points = routeOrthogonal(
      { point: { x: 0, y: 20 }, direction: 'right' },
      { point: { x: 100, y: 80 }, direction: 'left' },
      10,
    );
    expect(points).toEqual([
      { x: 0, y: 20 },
      { x: 50, y: 20 },
      { x: 50, y: 80 },
      { x: 100, y: 80 },
    ]);
  });

  test('creates a U route between ports facing the same side', () => {
    const points = routeOrthogonal(
      { point: { x: 20, y: 20 }, direction: 'right' },
      { point: { x: 60, y: 80 }, direction: 'right' },
      10,
    );
    expect(points).toEqual([
      { x: 20, y: 20 },
      { x: 70, y: 20 },
      { x: 70, y: 80 },
      { x: 60, y: 80 },
    ]);
  });

  test('removes duplicate and collinear points', () => {
    expect(simplifyOrthogonalPoints([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ])).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ]);
  });

  test('creates a rounded path', () => {
    expect(pointsToRoundedPath([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
    ], 5)).toBe('M 0 0 L 15 0 Q 20 0 20 5 L 20 20');
  });
});

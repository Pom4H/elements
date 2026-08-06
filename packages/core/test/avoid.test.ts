import { describe, expect, test } from 'bun:test';
import { routeAvoiding, routeBranched, routeOrthogonal } from '../src/routing/index.js';
import type { Point } from '../src/types.js';

const source = { point: { x: 0, y: 200 }, direction: 'right' as const };
const target = { point: { x: 400, y: 200 }, direction: 'left' as const };

/** A rectangle straddling the straight line between source and target. */
const wall = { x: 160, y: 120, width: 80, height: 160 };

function crosses(points: readonly Point[], rect: typeof wall, margin: number): boolean {
  const left = rect.x - margin;
  const right = rect.x + rect.width + margin;
  const top = rect.y - margin;
  const bottom = rect.y + rect.height + margin;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    if (Math.abs(from.y - to.y) < 0.5) {
      if (from.y <= top || from.y >= bottom) continue;
      if (Math.max(from.x, to.x) > left && Math.min(from.x, to.x) < right) return true;
    } else {
      if (from.x <= left || from.x >= right) continue;
      if (Math.max(from.y, to.y) > top && Math.min(from.y, to.y) < bottom) return true;
    }
  }
  return false;
}

describe('obstacle avoidance', () => {
  test('leaves a clear route exactly as it was', () => {
    const direct = routeOrthogonal(source, target, 26);
    expect(routeAvoiding(source, target, [], { stub: 26 })).toEqual(direct);
    expect(routeAvoiding(source, target, [{ x: 100, y: 500, width: 60, height: 60 }], { stub: 26 }))
      .toEqual(direct);
  });

  test('steps around an obstacle that blocks the straight run', () => {
    const margin = 12;
    const direct = routeOrthogonal(source, target, 26);
    expect(crosses(direct, wall, margin)).toBe(true);

    const avoided = routeAvoiding(source, target, [wall], { stub: 26, margin });
    expect(crosses(avoided, wall, margin)).toBe(false);
    expect(avoided[0]).toEqual(source.point);
    expect(avoided.at(-1)).toEqual(target.point);
  });

  test('keeps the declared clearance', () => {
    const avoided = routeAvoiding(source, target, [wall], { stub: 26, margin: 30 });
    expect(crosses(avoided, wall, 30)).toBe(false);
    // Hugging the clearance edge is allowed, so it should not detour further.
    expect(avoided.some((point) => point.y === wall.y - 30 || point.y === wall.y + wall.height + 30)).toBe(true);
  });

  test('prefers fewer corners when a bend costs more', () => {
    const cheap = routeAvoiding(source, target, [wall], { stub: 26, margin: 12, bendPenalty: 0 });
    const dear = routeAvoiding(source, target, [wall], { stub: 26, margin: 12, bendPenalty: 400 });
    expect(dear.length).toBeLessThanOrEqual(cheap.length);
  });

  test('ignores an obstacle an endpoint already sits inside', () => {
    // The target port is buried in this rectangle, so there is nothing to route
    // around and the run should stay direct rather than give up on the search.
    const swallowing = { x: 300, y: 140, width: 200, height: 140 };
    expect(routeAvoiding(source, target, [swallowing], { stub: 26, margin: 20 }))
      .toEqual(routeOrthogonal(source, target, 26));
  });

  test('falls back to the direct route when the target is walled in', () => {
    const cage = [
      { x: 340, y: 100, width: 20, height: 200 },
      { x: 340, y: 100, width: 200, height: 20 },
      { x: 340, y: 280, width: 200, height: 20 },
      { x: 520, y: 100, width: 20, height: 200 },
    ];
    const route = routeAvoiding(source, target, cage, { stub: 26, margin: 4 });
    expect(route[0]).toEqual(source.point);
    expect(route.at(-1)).toEqual(target.point);
  });

  test('branches avoid obstacles too', () => {
    const margin = 12;
    const route = routeBranched(
      source,
      [target, { point: { x: 200, y: 460 }, direction: 'top' }],
      { stub: 26, obstacles: [wall, { x: 120, y: 320, width: 200, height: 60 }], margin },
    );
    for (const branch of route.branches) {
      expect(crosses(branch, { x: 120, y: 320, width: 200, height: 60 }, margin)).toBe(false);
    }
  });
});

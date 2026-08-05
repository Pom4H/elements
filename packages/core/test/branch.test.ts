import { describe, expect, test } from 'bun:test';
import { pointAlongPolyline, polylineLength, routeBranched, tapPolyline } from '../src/routing/index.js';
import { parseEndpointSpecs, parseTapReference } from '../src/scene/model.js';

const run = [
  { x: 0, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 300 },
];

describe('polyline measurement', () => {
  test('measures total length across every segment', () => {
    expect(polylineLength(run)).toBe(400);
    expect(polylineLength([{ x: 5, y: 5 }])).toBe(0);
  });

  test('walks to a fraction of the total length', () => {
    expect(pointAlongPolyline(run, 0.25)?.point).toEqual({ x: 100, y: 100 });
    expect(pointAlongPolyline(run, 0.75)?.point).toEqual({ x: 200, y: 200 });
    expect(pointAlongPolyline(run, 0)?.point).toEqual({ x: 0, y: 100 });
    expect(pointAlongPolyline([{ x: 1, y: 1 }], 0.5)).toBeUndefined();
  });
});

describe('tapping a run', () => {
  const horizontal = [{ x: 0, y: 100 }, { x: 300, y: 100 }];
  const vertical = [{ x: 200, y: 0 }, { x: 200, y: 300 }];

  test('leaves a horizontal run vertically, towards the branch target', () => {
    expect(tapPolyline(horizontal, { x: 120, y: 260 })).toEqual({ point: { x: 120, y: 100 }, direction: 'bottom' });
    expect(tapPolyline(horizontal, { x: 120, y: 20 })).toEqual({ point: { x: 120, y: 100 }, direction: 'top' });
  });

  test('leaves a vertical run sideways', () => {
    expect(tapPolyline(vertical, { x: 320, y: 240 })).toEqual({ point: { x: 200, y: 240 }, direction: 'right' });
    expect(tapPolyline(vertical, { x: 90, y: 240 })).toEqual({ point: { x: 200, y: 240 }, direction: 'left' });
  });

  test('picks the leg that gives the shortest orthogonal branch', () => {
    // Dropping from the top leg costs 160; leaving the side leg costs 80.
    expect(tapPolyline(run, { x: 120, y: 260 })).toEqual({ point: { x: 200, y: 260 }, direction: 'left' });
    expect(tapPolyline(run, { x: 120, y: 20 })).toEqual({ point: { x: 120, y: 100 }, direction: 'top' });
  });

  test('honours a forced position along the run', () => {
    expect(tapPolyline(run, { x: 320, y: 240 }, 0.25)).toEqual({ point: { x: 100, y: 100 }, direction: 'bottom' });
  });

  test('needs at least one segment', () => {
    expect(tapPolyline([{ x: 0, y: 0 }], { x: 10, y: 10 })).toBeUndefined();
  });
});

describe('branched routing', () => {
  const source = { point: { x: 0, y: 100 }, direction: 'right' as const };

  test('routes a single target exactly like a plain connection', () => {
    const route = routeBranched(source, [{ point: { x: 300, y: 100 }, direction: 'left' as const }], { stub: 20 });
    expect(route.branches).toHaveLength(0);
    expect(route.tees).toHaveLength(0);
    expect(route.trunk.at(-1)).toEqual({ x: 300, y: 100 });
  });

  test('every target past the first leaves the trunk at a tee', () => {
    const route = routeBranched(source, [
      { point: { x: 300, y: 100 }, direction: 'left' },
      { point: { x: 200, y: 300 }, direction: 'top' },
    ], { stub: 20 });

    expect(route.branches).toHaveLength(1);
    expect(route.tees).toHaveLength(1);
    // The tee sits on the trunk, and the branch starts there and ends on the port.
    expect(route.tees[0]?.y).toBe(100);
    expect(route.branches[0]?.[0]).toEqual(route.tees[0]!);
    expect(route.branches[0]?.at(-1)).toEqual({ x: 200, y: 300 });
  });

  test('produces nothing without a target', () => {
    expect(routeBranched(source, [], { stub: 20 })).toEqual({ trunk: [], branches: [], tees: [] });
  });
});

describe('endpoint syntax', () => {
  test('reads several targets from one attribute', () => {
    expect(parseEndpointSpecs('t1:out v1:in,  p1:in')).toEqual([
      { type: 'port', elementId: 't1', portId: 'out' },
      { type: 'port', elementId: 'v1', portId: 'in' },
      { type: 'port', elementId: 'p1', portId: 'in' },
    ]);
    expect(parseEndpointSpecs(null)).toEqual([]);
  });

  test('a bare id targets a scene node such as a junction', () => {
    expect(parseEndpointSpecs('j1 other:in')).toEqual([
      { type: 'node', nodeId: 'j1' },
      { type: 'port', elementId: 'other', portId: 'in' },
    ]);
    expect(parseEndpointSpecs('bad@frac')).toEqual([]);
  });

  test('a source without a port names a run to tap', () => {
    expect(parseTapReference('header')).toEqual({ connectionId: 'header' });
    expect(parseTapReference('header@0.35')).toEqual({ connectionId: 'header', fraction: 0.35 });
    expect(parseTapReference('header@4')).toEqual({ connectionId: 'header', fraction: 1 });
    expect(parseTapReference('t1:out')).toBeUndefined();
    expect(parseTapReference('header@nope')).toBeUndefined();
    expect(parseTapReference(null)).toBeUndefined();
  });
});

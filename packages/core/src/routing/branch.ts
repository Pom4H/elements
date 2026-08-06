import type { Point, PortDirection } from '../types.js';
import type { RouteAnchor } from './anchor.js';
import { routeAvoiding, type AvoidOptions, type RouteObstacle } from './avoid.js';
import { stubPoint } from './orthogonal.js';

export interface BranchOptions extends AvoidOptions {
  readonly obstacles?: readonly RouteObstacle[];
}

export interface BranchedRoute {
  /** The main run, from the source to the first target. */
  readonly trunk: readonly Point[];
  /** One polyline per additional target, each leaving the trunk at a tee. */
  readonly branches: readonly (readonly Point[])[];
  /** Where each branch meets the trunk, in branch order. */
  readonly tees: readonly Point[];
}

function distance(first: Point, second: Point): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

/**
 * The direction a branch leaves an orthogonal run: perpendicular to the segment
 * it taps, pointing at whatever the branch is trying to reach.
 */
function branchDirection(from: Point, to: Point, toward: Point): PortDirection {
  const horizontal = Math.abs(to.x - from.x) >= Math.abs(to.y - from.y);
  if (horizontal) return toward.y >= from.y ? 'bottom' : 'top';
  return toward.x >= from.x ? 'right' : 'left';
}

function projectOntoSegment(first: Point, second: Point, target: Point): Point {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return first;
  const t = Math.min(1, Math.max(0, ((target.x - first.x) * dx + (target.y - first.y) * dy) / lengthSquared));
  return { x: first.x + dx * t, y: first.y + dy * t };
}

export function polylineLength(points: readonly Point[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1]!, points[index]!);
  }
  return total;
}

/**
 * The point a given fraction of the way along a polyline, together with the
 * segment it sits on.
 */
export function pointAlongPolyline(
  points: readonly Point[],
  fraction: number,
): { readonly point: Point; readonly from: Point; readonly to: Point } | undefined {
  if (points.length < 2) return undefined;
  const total = polylineLength(points);
  if (total === 0) return undefined;
  const wanted = Math.min(1, Math.max(0, fraction)) * total;

  let travelled = 0;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const length = distance(from, to);
    if (travelled + length >= wanted || index === points.length - 1) {
      const t = length === 0 ? 0 : (wanted - travelled) / length;
      return { point: { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }, from, to };
    }
    travelled += length;
  }
  return undefined;
}

/**
 * Where a run should be tapped to reach `toward`. Without a fraction the tap
 * lands at the nearest point on the run, which keeps the branch short; with one
 * it is forced to that position along the run.
 */
export function tapPolyline(
  points: readonly Point[],
  toward: Point,
  fraction?: number,
): RouteAnchor | undefined {
  if (points.length < 2) return undefined;

  if (fraction !== undefined) {
    const along = pointAlongPolyline(points, fraction);
    if (!along) return undefined;
    return { point: along.point, direction: branchDirection(along.from, along.to, toward) };
  }

  // Manhattan, not Euclidean: the branch leaves at a right angle, so the axis
  // distances are what it actually has to travel.
  let best: { point: Point; from: Point; to: Point; cost: number } | undefined;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const projected = projectOntoSegment(from, to, toward);
    const cost = Math.abs(projected.x - toward.x) + Math.abs(projected.y - toward.y);
    if (!best || cost < best.cost) best = { point: projected, from, to, cost };
  }
  if (!best) return undefined;
  return { point: best.point, direction: branchDirection(best.from, best.to, toward) };
}

/**
 * Routes one source to any number of targets, stepping around any obstacles it
 * is given. The first target defines the trunk; every other target taps the
 * trunk at its nearest point, which is what turns a two-port connection into a
 * tee.
 */
export function routeBranched(
  source: RouteAnchor,
  targets: readonly RouteAnchor[],
  options: BranchOptions = {},
): BranchedRoute {
  const [first, ...rest] = targets;
  if (!first) return { trunk: [], branches: [], tees: [] };

  const stub = options.stub ?? 26;
  const obstacles = options.obstacles ?? [];
  const trunk = routeAvoiding(source, first, obstacles, options);
  const branches: Point[][] = [];
  const tees: Point[] = [];

  for (const target of rest) {
    const tap = tapPolyline(trunk, stubPoint(target.point, target.direction, stub));
    if (!tap) continue;
    branches.push(routeAvoiding(tap, target, obstacles, options));
    tees.push(tap.point);
  }

  return { trunk, branches, tees };
}

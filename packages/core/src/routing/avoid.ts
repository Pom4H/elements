import type { Point } from '../types.js';
import {
  ROUTE_EPSILON,
  isHorizontalDirection,
  routeOrthogonal,
  simplifyOrthogonalPoints,
  stubPoint,
} from './orthogonal.js';
import type { RouteAnchor } from './anchor.js';

/** A rectangle a route should stay out of, in the same space as the route. */
export interface RouteObstacle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface AvoidOptions {
  readonly stub?: number;
  /** Clearance kept around every obstacle. */
  readonly margin?: number;
  /** Length a corner is worth. Higher values buy straighter, longer routes. */
  readonly bendPenalty?: number;
}

interface Bounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

const DEFAULT_MARGIN = 16;
const DEFAULT_BEND_PENALTY = 30;
/** Lattice size grows with the square of this, so it stays bounded. */
const MAX_OBSTACLES = 16;
const AXES = 3;
const NONE = 0;
const HORIZONTAL = 1;
const VERTICAL = 2;

function inflate(obstacle: RouteObstacle, margin: number): Bounds {
  return {
    left: obstacle.x - margin,
    top: obstacle.y - margin,
    right: obstacle.x + obstacle.width + margin,
    bottom: obstacle.y + obstacle.height + margin,
  };
}

/**
 * Whether an axis-aligned segment passes through a rectangle. Running along an
 * edge is allowed, which is what lets a route hug an obstacle at its clearance.
 */
function blocks(bounds: Bounds, from: Point, to: Point): boolean {
  if (Math.abs(from.y - to.y) < ROUTE_EPSILON) {
    if (from.y <= bounds.top || from.y >= bounds.bottom) return false;
    return Math.max(from.x, to.x) > bounds.left && Math.min(from.x, to.x) < bounds.right;
  }
  if (from.x <= bounds.left || from.x >= bounds.right) return false;
  return Math.max(from.y, to.y) > bounds.top && Math.min(from.y, to.y) < bounds.bottom;
}

function containsPoint(bounds: Bounds, point: Point): boolean {
  return point.x > bounds.left && point.x < bounds.right && point.y > bounds.top && point.y < bounds.bottom;
}

function pathBlocked(points: readonly Point[], rects: readonly Bounds[]): boolean {
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    if (rects.some((rect) => blocks(rect, from, to))) return true;
  }
  return false;
}

function sortedUnique(values: readonly number[]): number[] {
  return [...new Set(values)].sort((first, second) => first - second);
}

class MinHeap {
  readonly #costs: number[] = [];
  readonly #items: number[] = [];

  get size(): number {
    return this.#items.length;
  }

  push(cost: number, item: number): void {
    this.#costs.push(cost);
    this.#items.push(item);
    let index = this.#items.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.#costs[parent]! <= this.#costs[index]!) break;
      this.#swap(parent, index);
      index = parent;
    }
  }

  pop(): readonly [number, number] | undefined {
    if (this.#items.length === 0) return undefined;
    const cost = this.#costs[0]!;
    const item = this.#items[0]!;
    const lastCost = this.#costs.pop()!;
    const lastItem = this.#items.pop()!;
    if (this.#items.length > 0) {
      this.#costs[0] = lastCost;
      this.#items[0] = lastItem;
      let index = 0;
      for (;;) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        if (left < this.#items.length && this.#costs[left]! < this.#costs[smallest]!) smallest = left;
        if (right < this.#items.length && this.#costs[right]! < this.#costs[smallest]!) smallest = right;
        if (smallest === index) break;
        this.#swap(smallest, index);
        index = smallest;
      }
    }
    return [cost, item];
  }

  #swap(first: number, second: number): void {
    [this.#costs[first], this.#costs[second]] = [this.#costs[second]!, this.#costs[first]!];
    [this.#items[first], this.#items[second]] = [this.#items[second]!, this.#items[first]!];
  }
}

/**
 * Shortest turn-averse path across the lattice. States carry the axis the route
 * arrived on so a change of direction can be charged for.
 */
function search(
  xs: readonly number[],
  ys: readonly number[],
  rects: readonly Bounds[],
  start: Point,
  end: Point,
  startAxis: number,
  bendPenalty: number,
): Point[] | undefined {
  const width = xs.length;
  const startX = xs.indexOf(start.x);
  const startY = ys.indexOf(start.y);
  const endX = xs.indexOf(end.x);
  const endY = ys.indexOf(end.y);
  if (startX < 0 || startY < 0 || endX < 0 || endY < 0) return undefined;

  const states = width * ys.length * AXES;
  const best = new Float64Array(states).fill(Number.POSITIVE_INFINITY);
  const parent = new Int32Array(states).fill(-1);
  const heap = new MinHeap();
  const first = ((startY * width + startX) * AXES) + startAxis;
  best[first] = 0;
  heap.push(0, first);

  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

  for (;;) {
    const entry = heap.pop();
    if (!entry) return undefined;
    const [cost, state] = entry;
    if (cost > best[state]!) continue;

    const axis = state % AXES;
    const node = (state - axis) / AXES;
    const xi = node % width;
    const yi = (node - xi) / width;
    if (xi === endX && yi === endY) {
      const points: Point[] = [];
      for (let current = state; current >= 0; current = parent[current]!) {
        const currentAxis = current % AXES;
        const currentNode = (current - currentAxis) / AXES;
        const currentX = currentNode % width;
        points.push({ x: xs[currentX]!, y: ys[(currentNode - currentX) / width]! });
      }
      return points.reverse();
    }

    const from = { x: xs[xi]!, y: ys[yi]! };
    for (const [dx, dy] of steps) {
      const nx = xi + dx;
      const ny = yi + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= ys.length) continue;
      const to = { x: xs[nx]!, y: ys[ny]! };
      if (rects.some((rect) => blocks(rect, from, to))) continue;

      const nextAxis = dx !== 0 ? HORIZONTAL : VERTICAL;
      const turn = axis !== NONE && axis !== nextAxis ? bendPenalty : 0;
      const next = ((ny * width + nx) * AXES) + nextAxis;
      const nextCost = cost + Math.abs(to.x - from.x) + Math.abs(to.y - from.y) + turn;
      if (nextCost >= best[next]!) continue;
      best[next] = nextCost;
      parent[next] = state;
      heap.push(nextCost, next);
    }
  }
}

function nearestObstacles(
  obstacles: readonly RouteObstacle[],
  source: Point,
  target: Point,
): readonly RouteObstacle[] {
  if (obstacles.length <= MAX_OBSTACLES) return obstacles;
  const centreX = (source.x + target.x) / 2;
  const centreY = (source.y + target.y) / 2;
  return [...obstacles]
    .sort((first, second) => {
      const firstGap = Math.hypot(first.x + first.width / 2 - centreX, first.y + first.height / 2 - centreY);
      const secondGap = Math.hypot(second.x + second.width / 2 - centreX, second.y + second.height / 2 - centreY);
      return firstGap - secondGap;
    })
    .slice(0, MAX_OBSTACLES);
}

/**
 * An orthogonal route that steps around the given rectangles. When nothing is in
 * the way the direct route is returned untouched, so adding obstacles never
 * changes a connection that did not need them.
 */
export function routeAvoiding(
  source: RouteAnchor,
  target: RouteAnchor,
  obstacles: readonly RouteObstacle[],
  options: AvoidOptions = {},
): Point[] {
  const stub = options.stub ?? 26;
  const margin = options.margin ?? DEFAULT_MARGIN;
  const bendPenalty = options.bendPenalty ?? DEFAULT_BEND_PENALTY;

  const direct = routeOrthogonal(source, target, stub);
  if (obstacles.length === 0) return direct;

  const start = stubPoint(source.point, source.direction, stub);
  const end = stubPoint(target.point, target.direction, stub);
  const relevant = nearestObstacles(obstacles, source.point, target.point);
  // A rectangle an endpoint already sits inside cannot be avoided, and keeping
  // it would leave the search with nowhere to start.
  const rects = relevant
    .map((obstacle) => inflate(obstacle, margin))
    .filter((rect) => ![start, end, source.point, target.point].some((point) => containsPoint(rect, point)));
  if (rects.length === 0 || !pathBlocked(direct, rects)) return direct;
  const xs = sortedUnique([start.x, end.x, ...rects.flatMap((rect) => [rect.left, rect.right])]);
  const ys = sortedUnique([start.y, end.y, ...rects.flatMap((rect) => [rect.top, rect.bottom])]);

  const startAxis = isHorizontalDirection(source.direction) ? HORIZONTAL : VERTICAL;
  const path = search(xs, ys, rects, start, end, startAxis, bendPenalty);
  if (!path) return direct;
  return simplifyOrthogonalPoints([source.point, ...path, target.point]);
}

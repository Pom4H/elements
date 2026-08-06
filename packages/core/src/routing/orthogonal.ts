import type { Point, PortDirection } from '../types.js';

export const ROUTE_EPSILON = 0.5;
const EPSILON = ROUTE_EPSILON;

export const isHorizontalDirection = (direction: PortDirection): boolean => direction === 'left' || direction === 'right';
const isHorizontal = isHorizontalDirection;

/** Steps out of a port along its facing direction, where every route begins. */
export function stubPoint(point: Point, direction: PortDirection, stub: number): Point {
  switch (direction) {
    case 'left': return { x: point.x - stub, y: point.y };
    case 'right': return { x: point.x + stub, y: point.y };
    case 'top': return { x: point.x, y: point.y - stub };
    case 'bottom': return { x: point.x, y: point.y + stub };
  }
}

function bends(first: Point, firstDirection: PortDirection, second: Point, secondDirection: PortDirection): Point[] {
  const firstHorizontal = isHorizontal(firstDirection);
  const secondHorizontal = isHorizontal(secondDirection);

  if (firstHorizontal && secondHorizontal) {
    if (Math.abs(first.y - second.y) < EPSILON) return [];
    if (firstDirection !== secondDirection) {
      const forward = firstDirection === 'right' ? second.x >= first.x : second.x <= first.x;
      if (forward) {
        const middleX = (first.x + second.x) / 2;
        return [{ x: middleX, y: first.y }, { x: middleX, y: second.y }];
      }
      const middleY = (first.y + second.y) / 2;
      return [{ x: first.x, y: middleY }, { x: second.x, y: middleY }];
    }
    const outsideX = firstDirection === 'right' ? Math.max(first.x, second.x) : Math.min(first.x, second.x);
    return [{ x: outsideX, y: first.y }, { x: outsideX, y: second.y }];
  }

  if (!firstHorizontal && !secondHorizontal) {
    if (Math.abs(first.x - second.x) < EPSILON) return [];
    if (firstDirection !== secondDirection) {
      const forward = firstDirection === 'bottom' ? second.y >= first.y : second.y <= first.y;
      if (forward) {
        const middleY = (first.y + second.y) / 2;
        return [{ x: first.x, y: middleY }, { x: second.x, y: middleY }];
      }
      const middleX = (first.x + second.x) / 2;
      return [{ x: middleX, y: first.y }, { x: middleX, y: second.y }];
    }
    const outsideY = firstDirection === 'bottom' ? Math.max(first.y, second.y) : Math.min(first.y, second.y);
    return [{ x: first.x, y: outsideY }, { x: second.x, y: outsideY }];
  }

  return firstHorizontal ? [{ x: second.x, y: first.y }] : [{ x: first.x, y: second.y }];
}

export function simplifyOrthogonalPoints(points: readonly Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    const previous = result.at(-1);
    if (previous && Math.abs(previous.x - point.x) < EPSILON && Math.abs(previous.y - point.y) < EPSILON) continue;
    result.push(point);
    while (result.length >= 3) {
      const first = result[result.length - 3];
      const middle = result[result.length - 2];
      const last = result[result.length - 1];
      if (!first || !middle || !last) break;
      const collinear =
        (Math.abs(first.x - middle.x) < EPSILON && Math.abs(middle.x - last.x) < EPSILON) ||
        (Math.abs(first.y - middle.y) < EPSILON && Math.abs(middle.y - last.y) < EPSILON);
      if (!collinear) break;
      result.splice(result.length - 2, 1);
    }
  }
  return result;
}

export function routeOrthogonal(
  source: { readonly point: Point; readonly direction: PortDirection },
  target: { readonly point: Point; readonly direction: PortDirection },
  stub = 26,
): Point[] {
  const first = stubPoint(source.point, source.direction, stub);
  const second = stubPoint(target.point, target.direction, stub);
  return simplifyOrthogonalPoints([
    source.point,
    first,
    ...bends(first, source.direction, second, target.direction),
    second,
    target.point,
  ]);
}

export function pointsToRoundedPath(points: readonly Point[], radius = 10): string {
  const first = points[0];
  if (!first) return '';
  let path = `M ${first.x} ${first.y}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    if (!previous || !corner || !next) continue;
    const incomingLength = Math.hypot(corner.x - previous.x, corner.y - previous.y);
    const outgoingLength = Math.hypot(next.x - corner.x, next.y - corner.y);
    const resolvedRadius = Math.min(radius, incomingLength / 2, outgoingLength / 2);
    if (resolvedRadius < 1) {
      path += ` L ${corner.x} ${corner.y}`;
      continue;
    }
    const incomingX = corner.x - ((corner.x - previous.x) / incomingLength) * resolvedRadius;
    const incomingY = corner.y - ((corner.y - previous.y) / incomingLength) * resolvedRadius;
    const outgoingX = corner.x + ((next.x - corner.x) / outgoingLength) * resolvedRadius;
    const outgoingY = corner.y + ((next.y - corner.y) / outgoingLength) * resolvedRadius;
    path += ` L ${incomingX} ${incomingY} Q ${corner.x} ${corner.y} ${outgoingX} ${outgoingY}`;
  }
  const last = points.at(-1);
  if (last) path += ` L ${last.x} ${last.y}`;
  return path;
}

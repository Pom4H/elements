import type { Point, PortDirection } from '../types.js';

/** A place a route may start or end: a position plus the way it faces. */
export interface RouteAnchor {
  readonly point: Point;
  readonly direction: PortDirection;
}

import type { ElementContext } from '@pom4h/elements-core';

export function numberValue(context: ElementContext, name: string, fallback = 0): number {
  const value = Number(context.attributes[name]);
  return Number.isFinite(value) ? value : fallback;
}

export function stringValue(context: ElementContext, name: string, fallback = ''): string {
  const value = context.attributes[name];
  return typeof value === 'string' ? value : fallback;
}

export function booleanValue(context: ElementContext, name: string): boolean {
  return context.attributes[name] === true;
}

export function stateValue(context: ElementContext, name: string): boolean {
  return context.states[name] === true;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

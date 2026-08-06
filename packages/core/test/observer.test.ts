import { describe, expect, test } from 'bun:test';
import {
  defaultRepresentations,
  representationDefinitions,
  selectRepresentation,
} from '../src/observer.js';
import type { ObserverContext, RepresentationDefinition } from '../src/types.js';

function observer(overrides: Partial<ObserverContext> = {}): ObserverContext {
  return {
    role: 'viewer',
    intent: 'overview',
    scale: 'plant',
    fidelity: 'auto',
    capabilities: [],
    ...overrides,
  };
}

describe('observer-dependent representations', () => {
  test('maps observer scale and intent to progressively richer models', () => {
    expect(selectRepresentation(undefined, observer()).id).toBe('symbol');
    expect(selectRepresentation(undefined, observer({ role: 'operator', intent: 'monitor', scale: 'system' })).id).toBe('operational');
    expect(selectRepresentation(undefined, observer({ role: 'maintenance', intent: 'diagnose', scale: 'equipment' })).id).toBe('structural');
    expect(selectRepresentation(undefined, observer({ role: 'engineer', intent: 'simulate', scale: 'component' })).id).toBe('twin');
  });

  test('allows explicit fidelity and representation overrides', () => {
    const context = observer({ fidelity: 'structural' });
    expect(selectRepresentation(undefined, context).id).toBe('structural');
    expect(selectRepresentation(undefined, context, 'symbol').id).toBe('symbol');
  });

  test('falls back to the richest representation not exceeding the target', () => {
    const representations: readonly RepresentationDefinition[] = [
      { id: 'icon', label: 'Icon', fidelity: 'symbol' },
      { id: 'service', label: 'Service', fidelity: 'structural' },
    ];
    expect(selectRepresentation(representations, observer({ fidelity: 'operational' })).id).toBe('icon');
    expect(selectRepresentation(representations, observer({ fidelity: 'twin' })).id).toBe('service');
  });

  test('filters representations that require unavailable capabilities', () => {
    const representations: readonly RepresentationDefinition[] = [
      ...defaultRepresentations.slice(0, 3),
      { id: 'live-twin', label: 'Live twin', fidelity: 'twin', requires: ['geometry-3d'] },
    ];
    expect(selectRepresentation(representations, observer({ fidelity: 'twin' })).id).toBe('structural');
    expect(selectRepresentation(
      representations,
      observer({ fidelity: 'twin', capabilities: ['geometry-3d'] }),
    ).id).toBe('live-twin');
  });

  test('rejects duplicate representation identifiers', () => {
    expect(() => representationDefinitions([
      { id: 'same', label: 'One', fidelity: 'symbol' },
      { id: 'same', label: 'Two', fidelity: 'twin' },
    ])).toThrow(TypeError);
  });
});

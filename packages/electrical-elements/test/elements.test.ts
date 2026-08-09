import { describe, expect, test } from 'bun:test';
import { createManifestEntry, portCompatibility, resolvePorts, type ElementContext } from '@pom4h/elements-core';
import { electricalElementsManifest } from '../src/manifest.js';
import { breakerDefinition } from '../src/elements/breaker.js';
import { motorDefinition } from '../src/elements/motor.js';
import { transformerDefinition } from '../src/elements/transformer.js';

function contextWith(attributes: Record<string, unknown>): ElementContext {
  return { host: {} as HTMLElement, attributes, states: {} };
}

describe('@pom4h/electrical-elements', () => {
  test('publishes a server-safe package manifest with five elements', () => {
    expect(electricalElementsManifest.name).toBe('@pom4h/electrical-elements');
    expect(electricalElementsManifest.version).toBe('0.1.0');
    expect(electricalElementsManifest.elements.map((entry) => entry.tagName)).toEqual([
      'ee-motor',
      'ee-breaker',
      'ee-contactor',
      'ee-transformer',
      'ee-meter',
    ]);
  });

  test('breaker pole count rewrites live electrical terminal topology', () => {
    const onePole = resolvePorts(breakerDefinition.ports, contextWith({ poles: 1 }));
    const threePole = resolvePorts(breakerDefinition.ports, contextWith({ poles: 3 }));
    const fourPole = resolvePorts(breakerDefinition.ports, contextWith({ poles: 4 }));

    expect(onePole.map((port) => port.id)).toEqual(['line-1', 'load-1']);
    expect(threePole.map((port) => port.id)).toEqual(['line-1', 'load-1', 'line-2', 'load-2', 'line-3', 'load-3']);
    expect(fourPole).toHaveLength(8);
    expect(createManifestEntry(breakerDefinition).dynamicPorts).toBe(true);
  });

  test('breaker terminals use the existing wire compatibility contract', () => {
    const resolved = resolvePorts(breakerDefinition.ports, contextWith({ poles: 3 }));
    const line = resolved.find((port) => port.id === 'line-1');
    const load = resolved.find((port) => port.id === 'load-1');
    expect(line).toMatchObject({ kind: 'electrical', role: 'inlet' });
    expect(load).toMatchObject({ kind: 'electrical', role: 'outlet' });
    expect(portCompatibility('wire', line, load)).toEqual({ compatible: true });
  });

  test('motor derives operation and overload independently from severity', () => {
    const states = motorDefinition.states ?? {};
    const running = contextWith({ running: true, speed: 1450, load: 72, status: 'normal' });
    const overloaded = contextWith({ running: true, speed: 1450, load: 112, status: 'normal' });
    expect(states.running?.(running)).toBe(true);
    expect(states.overloaded?.(running)).toBe(false);
    expect(states.overloaded?.(overloaded)).toBe(true);
  });

  test('transformer remains inside the generic electrical port domain', () => {
    const ports = resolvePorts(transformerDefinition.ports, contextWith({}));
    expect(ports.map((port) => [port.id, port.kind, port.role])).toEqual([
      ['primary', 'electrical', 'inlet'],
      ['secondary', 'electrical', 'outlet'],
      ['ground', 'electrical', 'bidirectional'],
    ]);
  });
});

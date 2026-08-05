import { describe, expect, test } from 'bun:test';
import { initialPorts, portSignature, ports, resolvePorts } from '../src/definition.js';
import { portCompatibility } from '../src/scene/model.js';
import type { ElementContext, PortDefinition } from '../src/types.js';

function contextWith(attributes: Record<string, unknown>): ElementContext {
  return { host: {} as HTMLElement, attributes, states: {} };
}

const staticPorts: readonly PortDefinition[] = [
  { id: 'in', x: 0, y: 10, direction: 'left', kind: 'process', role: 'inlet' },
  { id: 'out', x: 40, y: 10, direction: 'right', kind: 'process', role: 'outlet' },
];

describe('port definitions', () => {
  test('keeps static port lists unchanged', () => {
    expect(initialPorts(staticPorts)).toEqual(staticPorts);
    expect(resolvePorts(staticPorts, contextWith({}))).toEqual(staticPorts);
    expect(initialPorts(undefined)).toEqual([]);
  });

  test('resolves dynamic ports from element context', () => {
    const definition = ports(staticPorts, ({ attributes }) => [
      ...staticPorts,
      ...Array.from({ length: Number(attributes.nozzles) }, (_, index) => ({
        id: `nozzle-${index + 1}`,
        x: 0,
        y: 20 + index * 10,
        direction: 'left' as const,
        kind: 'process',
      })),
    ]);

    expect(initialPorts(definition)).toHaveLength(2);
    expect(resolvePorts(definition, contextWith({ nozzles: 3 })).map((port) => port.id))
      .toEqual(['in', 'out', 'nozzle-1', 'nozzle-2', 'nozzle-3']);
  });

  test('rejects duplicate identifiers and non-finite coordinates', () => {
    expect(() => initialPorts([
      { id: 'in', x: 0, y: 0, direction: 'left' },
      { id: 'in', x: 4, y: 0, direction: 'right' },
    ])).toThrow(TypeError);
    expect(() => initialPorts([{ id: 'in', x: Number.NaN, y: 0, direction: 'left' }])).toThrow(TypeError);
  });

  test('signatures change only when a port actually moves or is retyped', () => {
    const signature = portSignature(staticPorts);
    expect(portSignature([...staticPorts])).toBe(signature);
    expect(portSignature([
      staticPorts[0]!,
      { ...staticPorts[1]!, y: 12 },
    ])).not.toBe(signature);
    expect(portSignature([
      staticPorts[0]!,
      { ...staticPorts[1]!, medium: 'oil' },
    ])).not.toBe(signature);
  });
});

describe('port compatibility', () => {
  test('accepts an outlet feeding an inlet of the same domain', () => {
    expect(portCompatibility('pipe', staticPorts[1], staticPorts[0])).toEqual({ compatible: true });
  });

  test('rejects a connection kind that does not match the port domain', () => {
    expect(portCompatibility('wire', staticPorts[1], staticPorts[0]))
      .toEqual({ compatible: false, issue: 'kind' });
    expect(portCompatibility('pipe', staticPorts[1], { kind: 'electrical', role: 'inlet' }))
      .toEqual({ compatible: false, issue: 'kind' });
  });

  test('rejects two ports facing the same way', () => {
    expect(portCompatibility('pipe', staticPorts[1], { kind: 'process', role: 'outlet' }))
      .toEqual({ compatible: false, issue: 'role' });
    expect(portCompatibility('pipe', staticPorts[1], { kind: 'process', role: 'bidirectional' }))
      .toEqual({ compatible: true });
  });

  test('rejects two ports carrying different media', () => {
    expect(portCompatibility('pipe', { kind: 'process', medium: 'oil' }, { kind: 'process', medium: 'water' }))
      .toEqual({ compatible: false, issue: 'medium' });
    expect(portCompatibility('pipe', { kind: 'process', medium: 'oil' }, { kind: 'process' }))
      .toEqual({ compatible: true });
  });

  test('stays permissive when an endpoint declares nothing', () => {
    expect(portCompatibility('pipe', undefined, staticPorts[0])).toEqual({ compatible: true });
    expect(portCompatibility('signal', { }, { })).toEqual({ compatible: true });
  });
});

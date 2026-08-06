import { describe, expect, test } from 'bun:test';
import { createManifestEntry, resolvePorts, resolveViewBox, type ElementContext } from '@pom4h/elements-core';
import { controlValveDefinition } from '../src/elements/control-valve.js';
import { tankDefinition } from '../src/elements/tank.js';

function contextWith(attributes: Record<string, unknown>): ElementContext {
  return { host: {} as HTMLElement, attributes, states: {} };
}

function portIds(definition: typeof tankDefinition, attributes: Record<string, unknown>): string[] {
  return resolvePorts(definition.ports, contextWith(attributes)).map((port) => port.id);
}

describe('pe-control-valve', () => {
  test('the auxiliary port follows the mounted actuator', () => {
    expect(portIds(controlValveDefinition, { actuator: 'pneumatic', medium: 'water' }))
      .toEqual(['in', 'out', 'signal', 'supply']);
    expect(portIds(controlValveDefinition, { actuator: 'electric', medium: 'water' }))
      .toEqual(['in', 'out', 'signal', 'power']);
  });

  test('the pneumatic supply is an air line and the electric supply is a wire', () => {
    const pneumatic = resolvePorts(controlValveDefinition.ports, contextWith({ actuator: 'pneumatic' }));
    const electric = resolvePorts(controlValveDefinition.ports, contextWith({ actuator: 'electric' }));
    expect(pneumatic.find((port) => port.id === 'supply')).toMatchObject({ kind: 'process', medium: 'air' });
    expect(electric.find((port) => port.id === 'power')).toMatchObject({ kind: 'electrical' });
  });

  test('the configured medium reaches the process ports', () => {
    const resolved = resolvePorts(controlValveDefinition.ports, contextWith({ medium: 'oil' }));
    expect(resolved.filter((port) => port.kind === 'process' && port.id !== 'supply').map((port) => port.medium))
      .toEqual(['oil', 'oil']);
  });

  test('travel states separate command from position', () => {
    const states = controlValveDefinition.states ?? {};
    const opening = contextWith({ position: 20, command: 60, deadband: 0.5, stuck: false });
    const closing = contextWith({ position: 60, command: 20, deadband: 0.5, stuck: false });
    const settled = contextWith({ position: 60, command: 60, deadband: 0.5, stuck: false });
    const jammed = contextWith({ position: 20, command: 60, deadband: 0.5, stuck: true });

    expect(states.opening?.(opening)).toBe(true);
    expect(states.closing?.(opening)).toBe(false);
    expect(states.closing?.(closing)).toBe(true);
    expect(states.travelling?.(settled)).toBe(false);
    expect(states.travelling?.(jammed)).toBe(false);
    expect(states.warning?.(jammed)).toBe(true);
  });
});

describe('pe-tank', () => {
  test('each generated nozzle adds a port', () => {
    expect(portIds(tankDefinition, { orientation: 'vertical', nozzles: 0 }))
      .toEqual(['in', 'out', 'vent']);
    expect(portIds(tankDefinition, { orientation: 'vertical', nozzles: 4 }))
      .toEqual(['in', 'out', 'vent', 'nozzle-1', 'nozzle-2', 'nozzle-3', 'nozzle-4']);
  });

  test('nozzle counts outside the supported range are clamped', () => {
    expect(portIds(tankDefinition, { nozzles: 12 })).toHaveLength(9);
    expect(portIds(tankDefinition, { nozzles: -3 })).toHaveLength(3);
  });

  test('nozzles are spread along the shell without stacking', () => {
    const resolved = resolvePorts(tankDefinition.ports, contextWith({ orientation: 'vertical', nozzles: 3 }));
    const offsets = resolved.filter((port) => port.id.startsWith('nozzle-')).map((port) => port.y);
    expect(new Set(offsets).size).toBe(3);
    expect(offsets).toEqual([...offsets].sort((first, second) => first - second));
  });

  test('the body style moves the nozzle axis and the viewport together', () => {
    const horizontal = contextWith({ orientation: 'horizontal', nozzles: 2 });
    const resolved = resolvePorts(tankDefinition.ports, horizontal);
    expect(resolved.filter((port) => port.id.startsWith('nozzle-')).map((port) => port.direction))
      .toEqual(['top', 'top']);
    expect(resolveViewBox(tankDefinition.viewBox, horizontal)).toBe('0 0 470 348');
    expect(resolveViewBox(tankDefinition.viewBox, contextWith({ orientation: 'vertical' }))).toBe('0 0 380 452');
  });

  test('limit states are independent from the reported status', () => {
    const states = tankDefinition.states ?? {};
    const low = contextWith({ level: 8, lowLimit: 15, highLimit: 85, lowAlarm: 5, highAlarm: 95, status: 'normal' });
    const critical = contextWith({ level: 2, lowLimit: 15, highLimit: 85, lowAlarm: 5, highAlarm: 95, status: 'normal' });

    expect(states.low?.(low)).toBe(true);
    expect(states['low-alarm']?.(low)).toBe(false);
    expect(states.warning?.(low)).toBe(true);
    expect(states.alarm?.(low)).toBe(false);
    expect(states['low-alarm']?.(critical)).toBe(true);
    expect(states.alarm?.(critical)).toBe(true);
  });
});

describe('manifests', () => {
  test('report a dynamic port set with a usable initial value', () => {
    const tank = createManifestEntry(tankDefinition);
    const valve = createManifestEntry(controlValveDefinition);

    expect(tank.dynamicPorts).toBe(true);
    expect(tank.dynamicViewBox).toBe(true);
    expect(tank.ports.map((port) => port.id)).toEqual(['in', 'out', 'vent', 'nozzle-1', 'nozzle-2']);
    expect(valve.dynamicPorts).toBe(true);
    expect(valve.dynamicViewBox).toBe(false);
  });
});

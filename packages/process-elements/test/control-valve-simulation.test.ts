import { describe, expect, test } from 'bun:test';
import { ControlValveSimulation } from '../src/simulation/control-valve.js';

const base = {
  powered: true,
  supplyPressure: 5,
  outletPressure: 1,
  capacity: 16,
  characteristic: 'equal-percentage' as const,
  rangeability: 50,
  leakage: .0005,
  upstreamResistance: .05,
  travelTime: 1,
  failPosition: 0,
  deadband: .1,
  stiction: 0,
};

describe('control valve simulation', () => {
  test('derives travel, flow and upstream pressure from engineering parameters', () => {
    const simulation = new ControlValveSimulation({ initialPosition: 0 });
    const closed = simulation.step({ ...base, command: 0 }, .1);
    let opened = closed;
    for (let index = 0; index < 10; index += 1) {
      opened = simulation.step({ ...base, command: 100 }, .1);
    }

    expect(opened.position).toBeCloseTo(100, 6);
    expect(opened.flow).toBeGreaterThan(closed.flow);
    expect(closed.pressureIn).toBeGreaterThan(opened.pressureIn);
    expect(opened.severity).toBe('normal');
  });

  test('creates warning and alarm from persistent travel deviation', () => {
    const simulation = new ControlValveSimulation({
      initialPosition: 0,
      warningDelay: .2,
      alarmDelay: .4,
    });

    let snapshot = simulation.step({ ...base, command: 80, stiction: 100 }, .1);
    snapshot = simulation.step({ ...base, command: 80, stiction: 100 }, .1);
    expect(snapshot.severity).toBe('warning');
    snapshot = simulation.step({ ...base, command: 80, stiction: 100 }, .2);
    expect(snapshot.severity).toBe('alarm');
    expect(snapshot.activeRules.map((entry) => entry.id)).toContain('travel-deviation-alarm');
  });

  test('fails toward the configured safe position when control air is lost', () => {
    const simulation = new ControlValveSimulation({ initialPosition: 100 });
    let snapshot = simulation.step({ ...base, command: 100, powered: false }, .5);
    expect(snapshot.position).toBeCloseTo(50);
    snapshot = simulation.step({ ...base, command: 100, powered: false }, .5);
    expect(snapshot.position).toBe(0);
  });
});

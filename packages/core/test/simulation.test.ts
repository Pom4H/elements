import { describe, expect, test } from 'bun:test';
import {
  SimulationRuleEngine,
  advanceLinearActuator,
  restrictionResistance,
  simulationRule,
  solveHydraulicNetwork,
} from '../src/simulation/index.js';

describe('simulation primitives', () => {
  test('derives flow and intermediate pressure from connected resistances', () => {
    const open = solveHydraulicNetwork({
      boundaries: [
        { node: 'supply', pressure: 5 },
        { node: 'sink', pressure: 1 },
      ],
      edges: [
        { id: 'pipe', from: 'supply', to: 'valve-in', resistance: .05 },
        { id: 'valve', from: 'valve-in', to: 'sink', resistance: restrictionResistance({ opening: .8, capacity: 16 }) },
      ],
    });
    const throttled = solveHydraulicNetwork({
      boundaries: [
        { node: 'supply', pressure: 5 },
        { node: 'sink', pressure: 1 },
      ],
      edges: [
        { id: 'pipe', from: 'supply', to: 'valve-in', resistance: .05 },
        { id: 'valve', from: 'valve-in', to: 'sink', resistance: restrictionResistance({ opening: .2, capacity: 16 }) },
      ],
    });

    expect(open.flows.valve).toBeGreaterThan(throttled.flows.valve ?? 0);
    expect(throttled.pressures['valve-in']).toBeGreaterThan(open.pressures['valve-in'] ?? 0);
    expect(open.flows.pipe).toBeCloseTo(open.flows.valve ?? 0, 8);
  });

  test('moves an actuator from command and fails to its safe position', () => {
    let state = { position: 0, moving: false, deviation: 0 };
    state = advanceLinearActuator(state, {
      command: 100,
      powered: true,
      travelTime: 2,
      deadband: .1,
    }, .5);
    expect(state.position).toBeCloseTo(25);
    expect(state.moving).toBe(true);

    state = advanceLinearActuator(state, {
      command: 100,
      powered: false,
      failPosition: 0,
      travelTime: 1,
    }, .5);
    expect(state.position).toBe(0);
  });

  test('applies alarm delay and hysteresis without changing process signals', () => {
    const rules = new SimulationRuleEngine([
      simulationRule.above('deviation-warning', 'warning', 'deviation', 5, 'Travel deviation', {
        delaySeconds: 1,
        hysteresis: 1,
      }),
      simulationRule.above('deviation-alarm', 'alarm', 'deviation', 15, 'Travel deviation alarm', {
        delaySeconds: 2,
        hysteresis: 2,
      }),
    ]);

    expect(rules.evaluate({ deviation: 18 }, .5).severity).toBe('normal');
    expect(rules.evaluate({ deviation: 18 }, .5).severity).toBe('warning');
    expect(rules.evaluate({ deviation: 18 }, 1).severity).toBe('alarm');
    expect(rules.evaluate({ deviation: 14 }, .1).severity).toBe('alarm');
    expect(rules.evaluate({ deviation: 12 }, .1).severity).toBe('warning');
  });
});

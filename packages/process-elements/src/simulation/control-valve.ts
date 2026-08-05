import {
  SimulationRuleEngine,
  advanceLinearActuator,
  restrictionResistance,
  simulationRule,
  solveHydraulicNetwork,
  type ActiveSimulationRule,
  type LinearActuatorState,
  type RestrictionCharacteristic,
  type SimulationSeverity,
} from '@pom4h/elements-core';

export interface SimulationParameterDescriptor {
  readonly label: string;
  readonly unit?: string;
  readonly defaultValue: number | boolean | string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly description: string;
}

export const controlValveSimulationParameters = Object.freeze({
  command: { label: 'Position setpoint', unit: '%', defaultValue: 0, minimum: 0, maximum: 100, description: 'Requested valve travel.' },
  powered: { label: 'Control air available', defaultValue: true, description: 'Availability of the pneumatic control chain.' },
  supplyPressure: { label: 'Supply pressure', unit: 'bar', defaultValue: 5, minimum: 0, maximum: 25, description: 'Pressure at the upstream hydraulic boundary.' },
  outletPressure: { label: 'Outlet pressure', unit: 'bar', defaultValue: 1, minimum: 0, maximum: 25, description: 'Pressure at the downstream hydraulic boundary.' },
  capacity: { label: 'Valve capacity Cv', defaultValue: 16, minimum: .01, maximum: 500, description: 'Full-open hydraulic conductance coefficient.' },
  characteristic: { label: 'Trim characteristic', defaultValue: 'equal-percentage', description: 'Linear, equal-percentage or quick-opening trim.' },
  rangeability: { label: 'Rangeability', defaultValue: 50, minimum: 2, maximum: 500, description: 'Equal-percentage controllable range.' },
  leakage: { label: 'Closed leakage', unit: 'fraction', defaultValue: .0005, minimum: .000001, maximum: .25, description: 'Residual conductance at zero travel.' },
  upstreamResistance: { label: 'Upstream line resistance', unit: 'bar/(m³/h)', defaultValue: .05, minimum: .000001, maximum: 100, description: 'Combined resistance of the upstream pipe and fittings.' },
  travelTime: { label: 'Full travel time', unit: 's', defaultValue: 2.4, minimum: .05, maximum: 120, description: 'Time required for a full actuator stroke.' },
  failPosition: { label: 'Fail position', unit: '%', defaultValue: 0, minimum: 0, maximum: 100, description: 'Safe travel target when control power or air is lost.' },
  deadband: { label: 'Positioner deadband', unit: '%', defaultValue: .25, minimum: 0, maximum: 10, description: 'Deviation ignored by the positioner.' },
  stiction: { label: 'Stem stiction', unit: '%', defaultValue: .6, minimum: 0, maximum: 20, description: 'Minimum deviation required to break static friction.' },
} satisfies Readonly<Record<string, SimulationParameterDescriptor>>);

export interface ControlValveSimulationParameters {
  readonly command: number;
  readonly powered: boolean;
  readonly supplyPressure: number;
  readonly outletPressure: number;
  readonly capacity: number;
  readonly characteristic?: RestrictionCharacteristic;
  readonly rangeability?: number;
  readonly leakage?: number;
  readonly upstreamResistance?: number;
  readonly travelTime?: number;
  readonly failPosition?: number;
  readonly deadband?: number;
  readonly stiction?: number;
}

export interface ControlValveSimulationOptions {
  readonly initialPosition?: number;
  readonly warningDeviation?: number;
  readonly alarmDeviation?: number;
  readonly warningDelay?: number;
  readonly alarmDelay?: number;
  readonly maximumPressureDrop?: number;
}

export interface ControlValveSimulationSnapshot {
  readonly position: number;
  readonly command: number;
  readonly moving: boolean;
  readonly deviation: number;
  readonly flow: number;
  readonly pressureIn: number;
  readonly pressureOut: number;
  readonly pressureDrop: number;
  readonly severity: SimulationSeverity;
  readonly activeRules: readonly ActiveSimulationRule[];
}

export class ControlValveSimulation {
  #actuator: LinearActuatorState;
  readonly #rules: SimulationRuleEngine;

  constructor(options: ControlValveSimulationOptions = {}) {
    const initialPosition = Math.min(100, Math.max(0, options.initialPosition ?? 0));
    this.#actuator = Object.freeze({ position: initialPosition, moving: false, deviation: 0 });
    this.#rules = new SimulationRuleEngine([
      simulationRule.above(
        'travel-deviation-warning',
        'warning',
        'absoluteDeviation',
        options.warningDeviation ?? 5,
        'Valve travel is not following its setpoint.',
        { delaySeconds: options.warningDelay ?? .7, hysteresis: 1 },
      ),
      simulationRule.above(
        'travel-deviation-alarm',
        'alarm',
        'absoluteDeviation',
        options.alarmDeviation ?? 15,
        'Valve travel deviation exceeded the alarm limit.',
        { delaySeconds: options.alarmDelay ?? 2, hysteresis: 2 },
      ),
      simulationRule.above(
        'pressure-drop-warning',
        'warning',
        'pressureDrop',
        options.maximumPressureDrop ?? 8,
        'Valve differential pressure is above the configured operating range.',
        { delaySeconds: .5, hysteresis: .5 },
      ),
    ]);
  }

  reset(position = 0): void {
    const normalized = Math.min(100, Math.max(0, position));
    this.#actuator = Object.freeze({ position: normalized, moving: false, deviation: 0 });
    this.#rules.reset();
  }

  step(parameters: ControlValveSimulationParameters, deltaSeconds: number): ControlValveSimulationSnapshot {
    this.#actuator = advanceLinearActuator(this.#actuator, {
      command: parameters.command,
      powered: parameters.powered,
      failPosition: parameters.failPosition ?? 0,
      travelTime: parameters.travelTime ?? 2.4,
      deadband: parameters.deadband ?? .25,
      stiction: parameters.stiction ?? .6,
      minimum: 0,
      maximum: 100,
    }, deltaSeconds);

    const opening = this.#actuator.position / 100;
    const solution = solveHydraulicNetwork({
      boundaries: [
        { node: 'supply', pressure: parameters.supplyPressure },
        { node: 'outlet', pressure: parameters.outletPressure },
      ],
      edges: [
        {
          id: 'upstream-line',
          from: 'supply',
          to: 'valve-in',
          resistance: Math.max(.000001, parameters.upstreamResistance ?? .05),
        },
        {
          id: 'valve-trim',
          from: 'valve-in',
          to: 'outlet',
          resistance: restrictionResistance({
            opening,
            capacity: Math.max(.000001, parameters.capacity),
            characteristic: parameters.characteristic ?? 'equal-percentage',
            rangeability: parameters.rangeability ?? 50,
            leakage: parameters.leakage ?? .0005,
          }),
        },
      ],
    });

    const flow = solution.flows['valve-trim'] ?? 0;
    const pressureIn = solution.pressures['valve-in'] ?? parameters.supplyPressure;
    const pressureOut = solution.pressures.outlet ?? parameters.outletPressure;
    const pressureDrop = pressureIn - pressureOut;
    const absoluteDeviation = Math.abs(this.#actuator.deviation);
    const evaluation = this.#rules.evaluate({
      absoluteDeviation,
      pressureDrop,
      flow,
      powered: parameters.powered,
    }, deltaSeconds);

    return Object.freeze({
      position: this.#actuator.position,
      command: Math.min(100, Math.max(0, parameters.command)),
      moving: this.#actuator.moving,
      deviation: this.#actuator.deviation,
      flow,
      pressureIn,
      pressureOut,
      pressureDrop,
      severity: evaluation.severity,
      activeRules: evaluation.active,
    });
  }
}

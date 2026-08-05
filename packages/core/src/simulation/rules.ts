export type SimulationSeverity = 'normal' | 'warning' | 'alarm';
export type SimulationSignals = Readonly<Record<string, number | boolean | string>>;

export interface ThresholdCondition {
  readonly signal: string;
  readonly operator: 'above' | 'below' | 'outside';
  readonly threshold: number;
  readonly upperThreshold?: number;
  readonly hysteresis?: number;
}

export interface SimulationRuleDefinition {
  readonly id: string;
  readonly severity: Exclude<SimulationSeverity, 'normal'>;
  readonly message: string;
  readonly condition: ThresholdCondition | ((signals: SimulationSignals) => boolean);
  readonly delaySeconds?: number;
}

export interface ActiveSimulationRule {
  readonly id: string;
  readonly severity: Exclude<SimulationSeverity, 'normal'>;
  readonly message: string;
}

export interface RuleEvaluation {
  readonly severity: SimulationSeverity;
  readonly active: readonly ActiveSimulationRule[];
}

interface RuleRuntime {
  elapsed: number;
  active: boolean;
}

function numeric(signals: SimulationSignals, name: string): number {
  const value = signals[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function conditionActive(condition: ThresholdCondition, signals: SimulationSignals, wasActive: boolean): boolean {
  const value = numeric(signals, condition.signal);
  const hysteresis = Math.max(0, condition.hysteresis ?? 0);
  if (condition.operator === 'above') {
    return wasActive ? value > condition.threshold - hysteresis : value > condition.threshold;
  }
  if (condition.operator === 'below') {
    return wasActive ? value < condition.threshold + hysteresis : value < condition.threshold;
  }
  const upper = condition.upperThreshold ?? condition.threshold;
  return wasActive
    ? value < condition.threshold + hysteresis || value > upper - hysteresis
    : value < condition.threshold || value > upper;
}

export class SimulationRuleEngine {
  readonly #definitions: readonly SimulationRuleDefinition[];
  readonly #runtime = new Map<string, RuleRuntime>();

  constructor(definitions: readonly SimulationRuleDefinition[]) {
    const ids = new Set<string>();
    for (const definition of definitions) {
      if (ids.has(definition.id)) throw new Error(`Duplicate simulation rule id: ${definition.id}`);
      ids.add(definition.id);
    }
    this.#definitions = definitions;
  }

  reset(): void {
    this.#runtime.clear();
  }

  evaluate(signals: SimulationSignals, deltaSeconds: number): RuleEvaluation {
    const active: ActiveSimulationRule[] = [];
    for (const definition of this.#definitions) {
      const runtime = this.#runtime.get(definition.id) ?? { elapsed: 0, active: false };
      const matches = typeof definition.condition === 'function'
        ? definition.condition(signals)
        : conditionActive(definition.condition, signals, runtime.active);

      if (matches) runtime.elapsed += Math.max(0, deltaSeconds);
      else runtime.elapsed = 0;

      runtime.active = matches && runtime.elapsed >= Math.max(0, definition.delaySeconds ?? 0);
      this.#runtime.set(definition.id, runtime);
      if (runtime.active) active.push({
        id: definition.id,
        severity: definition.severity,
        message: definition.message,
      });
    }

    const severity: SimulationSeverity = active.some((entry) => entry.severity === 'alarm')
      ? 'alarm'
      : active.length > 0 ? 'warning' : 'normal';
    return Object.freeze({ severity, active: Object.freeze(active) });
  }
}

function thresholdRule(
  id: string,
  severity: Exclude<SimulationSeverity, 'normal'>,
  signal: string,
  operator: ThresholdCondition['operator'],
  threshold: number,
  message: string,
  options: { readonly upperThreshold?: number; readonly hysteresis?: number; readonly delaySeconds?: number } = {},
): SimulationRuleDefinition {
  return Object.freeze({
    id,
    severity,
    message,
    condition: {
      signal,
      operator,
      threshold,
      ...(options.upperThreshold === undefined ? {} : { upperThreshold: options.upperThreshold }),
      ...(options.hysteresis === undefined ? {} : { hysteresis: options.hysteresis }),
    },
    ...(options.delaySeconds === undefined ? {} : { delaySeconds: options.delaySeconds }),
  });
}

export const simulationRule = {
  above(
    id: string,
    severity: Exclude<SimulationSeverity, 'normal'>,
    signal: string,
    threshold: number,
    message: string,
    options?: { readonly hysteresis?: number; readonly delaySeconds?: number },
  ): SimulationRuleDefinition {
    return thresholdRule(id, severity, signal, 'above', threshold, message, options);
  },

  below(
    id: string,
    severity: Exclude<SimulationSeverity, 'normal'>,
    signal: string,
    threshold: number,
    message: string,
    options?: { readonly hysteresis?: number; readonly delaySeconds?: number },
  ): SimulationRuleDefinition {
    return thresholdRule(id, severity, signal, 'below', threshold, message, options);
  },

  outside(
    id: string,
    severity: Exclude<SimulationSeverity, 'normal'>,
    signal: string,
    minimum: number,
    maximum: number,
    message: string,
    options?: { readonly hysteresis?: number; readonly delaySeconds?: number },
  ): SimulationRuleDefinition {
    return thresholdRule(id, severity, signal, 'outside', minimum, message, {
      ...options,
      upperThreshold: maximum,
    });
  },

  custom(
    id: string,
    severity: Exclude<SimulationSeverity, 'normal'>,
    message: string,
    condition: (signals: SimulationSignals) => boolean,
    delaySeconds?: number,
  ): SimulationRuleDefinition {
    return Object.freeze({ id, severity, message, condition, ...(delaySeconds === undefined ? {} : { delaySeconds }) });
  },
};

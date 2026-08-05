export type HydraulicNodeId = string;
export type HydraulicEdgeId = string;

export interface HydraulicBoundary {
  readonly node: HydraulicNodeId;
  readonly pressure: number;
}

export interface HydraulicEdge {
  readonly id: HydraulicEdgeId;
  readonly from: HydraulicNodeId;
  readonly to: HydraulicNodeId;
  readonly resistance: number;
  readonly pressureGain?: number;
}

export interface HydraulicNetworkDefinition {
  readonly boundaries: readonly HydraulicBoundary[];
  readonly edges: readonly HydraulicEdge[];
}

export interface HydraulicSolution {
  readonly pressures: Readonly<Record<HydraulicNodeId, number>>;
  readonly flows: Readonly<Record<HydraulicEdgeId, number>>;
}

function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite.`);
  return value;
}

function positive(value: number, name: string): number {
  finite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero.`);
  return value;
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] {
  const size = vector.length;
  for (let pivot = 0; pivot < size; pivot += 1) {
    let row = pivot;
    for (let candidate = pivot + 1; candidate < size; candidate += 1) {
      if (Math.abs(matrix[candidate]?.[pivot] ?? 0) > Math.abs(matrix[row]?.[pivot] ?? 0)) row = candidate;
    }

    const pivotValue = matrix[row]?.[pivot] ?? 0;
    if (Math.abs(pivotValue) < 1e-12) {
      throw new Error('Hydraulic network is singular. Every connected component needs a pressure boundary.');
    }

    if (row !== pivot) {
      [matrix[pivot], matrix[row]] = [matrix[row]!, matrix[pivot]!];
      [vector[pivot], vector[row]] = [vector[row]!, vector[pivot]!];
    }

    for (let candidate = pivot + 1; candidate < size; candidate += 1) {
      const factor = (matrix[candidate]?.[pivot] ?? 0) / pivotValue;
      if (Math.abs(factor) < 1e-16) continue;
      for (let column = pivot; column < size; column += 1) {
        matrix[candidate]![column] = (matrix[candidate]?.[column] ?? 0) - factor * (matrix[pivot]?.[column] ?? 0);
      }
      vector[candidate] = (vector[candidate] ?? 0) - factor * (vector[pivot] ?? 0);
    }
  }

  const solution = Array<number>(size).fill(0);
  for (let row = size - 1; row >= 0; row -= 1) {
    let value = vector[row] ?? 0;
    for (let column = row + 1; column < size; column += 1) {
      value -= (matrix[row]?.[column] ?? 0) * (solution[column] ?? 0);
    }
    solution[row] = value / (matrix[row]?.[row] ?? 1);
  }
  return solution;
}

export function solveHydraulicNetwork(definition: HydraulicNetworkDefinition): HydraulicSolution {
  const fixed = new Map<HydraulicNodeId, number>();
  for (const boundary of definition.boundaries) {
    const pressure = finite(boundary.pressure, `Boundary pressure for ${boundary.node}`);
    const existing = fixed.get(boundary.node);
    if (existing !== undefined && Math.abs(existing - pressure) > 1e-9) {
      throw new Error(`Hydraulic node ${boundary.node} has conflicting pressure boundaries.`);
    }
    fixed.set(boundary.node, pressure);
  }

  const nodes = new Set<HydraulicNodeId>();
  for (const edge of definition.edges) {
    if (edge.from === edge.to) throw new Error(`Hydraulic edge ${edge.id} connects a node to itself.`);
    positive(edge.resistance, `Resistance for ${edge.id}`);
    finite(edge.pressureGain ?? 0, `Pressure gain for ${edge.id}`);
    nodes.add(edge.from);
    nodes.add(edge.to);
  }
  for (const node of fixed.keys()) nodes.add(node);

  const unknown = [...nodes].filter((node) => !fixed.has(node));
  const index = new Map(unknown.map((node, position) => [node, position] as const));
  const matrix = Array.from({ length: unknown.length }, () => Array<number>(unknown.length).fill(0));
  const vector = Array<number>(unknown.length).fill(0);

  for (const edge of definition.edges) {
    const conductance = 1 / edge.resistance;
    const gain = edge.pressureGain ?? 0;
    const endpoints = [
      { node: edge.from, other: edge.to, sign: 1 },
      { node: edge.to, other: edge.from, sign: -1 },
    ] as const;

    for (const endpoint of endpoints) {
      const row = index.get(endpoint.node);
      if (row === undefined) continue;
      matrix[row]![row] = (matrix[row]?.[row] ?? 0) + conductance;
      const otherColumn = index.get(endpoint.other);
      if (otherColumn === undefined) {
        vector[row] = (vector[row] ?? 0) + conductance * (fixed.get(endpoint.other) ?? 0);
      } else {
        matrix[row]![otherColumn] = (matrix[row]?.[otherColumn] ?? 0) - conductance;
      }
      vector[row] = (vector[row] ?? 0) - conductance * endpoint.sign * gain;
    }
  }

  const solved = unknown.length === 0 ? [] : solveLinearSystem(matrix, vector);
  const pressures: Record<string, number> = Object.fromEntries(fixed);
  unknown.forEach((node, position) => { pressures[node] = solved[position] ?? 0; });

  const flows: Record<string, number> = {};
  for (const edge of definition.edges) {
    flows[edge.id] = (
      (pressures[edge.from] ?? 0)
      - (pressures[edge.to] ?? 0)
      + (edge.pressureGain ?? 0)
    ) / edge.resistance;
  }

  return Object.freeze({ pressures: Object.freeze(pressures), flows: Object.freeze(flows) });
}

export interface PipeResistanceOptions {
  readonly length: number;
  readonly diameter: number;
  readonly roughness?: number;
  readonly scale?: number;
}

export function pipeResistance(options: PipeResistanceOptions): number {
  const length = positive(options.length, 'Pipe length');
  const diameter = positive(options.diameter, 'Pipe diameter');
  const roughness = Math.max(0, finite(options.roughness ?? .02, 'Pipe roughness'));
  const scale = positive(options.scale ?? 1, 'Pipe resistance scale');
  return scale * length * (1 + roughness * 12) / diameter ** 4;
}

export type RestrictionCharacteristic = 'linear' | 'equal-percentage' | 'quick-opening';

export interface RestrictionOptions {
  readonly opening: number;
  readonly capacity: number;
  readonly characteristic?: RestrictionCharacteristic;
  readonly rangeability?: number;
  readonly leakage?: number;
}

export function restrictionConductance(options: RestrictionOptions): number {
  const opening = Math.min(1, Math.max(0, finite(options.opening, 'Restriction opening')));
  const capacity = positive(options.capacity, 'Restriction capacity');
  const leakage = Math.min(.25, Math.max(1e-6, finite(options.leakage ?? .0005, 'Restriction leakage')));
  const characteristic = options.characteristic ?? 'equal-percentage';

  let relative: number;
  if (characteristic === 'linear') relative = opening;
  else if (characteristic === 'quick-opening') relative = Math.sqrt(opening);
  else {
    const rangeability = Math.max(2, finite(options.rangeability ?? 50, 'Restriction rangeability'));
    relative = Math.pow(rangeability, opening - 1);
  }

  return capacity * Math.max(leakage, relative);
}

export function restrictionResistance(options: RestrictionOptions): number {
  return 1 / restrictionConductance(options);
}

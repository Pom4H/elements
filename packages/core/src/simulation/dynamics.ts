export interface LinearActuatorParameters {
  readonly command: number;
  readonly powered: boolean;
  readonly failPosition?: number;
  readonly travelTime?: number;
  readonly deadband?: number;
  readonly stiction?: number;
  readonly minimum?: number;
  readonly maximum?: number;
}

export interface LinearActuatorState {
  readonly position: number;
  readonly moving: boolean;
  readonly deviation: number;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function advanceLinearActuator(
  state: LinearActuatorState,
  parameters: LinearActuatorParameters,
  deltaSeconds: number,
): LinearActuatorState {
  const minimum = finite(parameters.minimum ?? 0, 0);
  const maximum = Math.max(minimum, finite(parameters.maximum ?? 100, 100));
  const clamp = (value: number) => Math.min(maximum, Math.max(minimum, finite(value, minimum)));
  const command = clamp(parameters.powered ? parameters.command : parameters.failPosition ?? minimum);
  const position = clamp(state.position);
  const deviation = command - position;
  const deadband = Math.max(0, finite(parameters.deadband ?? .2, .2));
  const stiction = Math.max(0, finite(parameters.stiction ?? 0, 0));
  const threshold = Math.max(deadband, stiction);

  if (Math.abs(deviation) <= threshold || deltaSeconds <= 0) {
    return Object.freeze({ position, moving: false, deviation });
  }

  const travelTime = Math.max(.01, finite(parameters.travelTime ?? 1, 1));
  const rate = (maximum - minimum) / travelTime;
  const step = Math.min(Math.abs(deviation), rate * deltaSeconds);
  const nextPosition = clamp(position + Math.sign(deviation) * step);
  const nextDeviation = command - nextPosition;
  return Object.freeze({
    position: nextPosition,
    moving: Math.abs(nextDeviation) > deadband,
    deviation: nextDeviation,
  });
}

import { ControlValveSimulation } from '@pom4h/process-elements';
import { registerProcessElements } from '@pom4h/process-elements/register';
import './style.css';

registerProcessElements();

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing playground element: ${selector}`);
  return element;
}

function randomBits(length: number, probability = .5): string {
  return Array.from({ length }, () => Math.random() < probability ? '1' : '0').join('');
}

const pump = required<HTMLElement>('#pump');
const controller = required<HTMLElement>('#controller');
const speed = required<HTMLInputElement>('#speed');
const speedValue = required<HTMLOutputElement>('#speed-value');
const pumpStatus = required<HTMLSelectElement>('#pump-status');
const pumpQuality = required<HTMLSelectElement>('#pump-quality');
const pumpToggle = required<HTMLButtonElement>('#pump-toggle');
const channels = required<HTMLSelectElement>('#channels');
const load = required<HTMLInputElement>('#load');
const loadValue = required<HTMLOutputElement>('#load-value');
const activity = required<HTMLButtonElement>('#activity');
const controllerAlarm = required<HTMLButtonElement>('#controller-alarm');
const processPipe = required<HTMLElement>('#process-pipe');
const flowSpeed = required<HTMLInputElement>('#flow-speed');
const flowSpeedValue = required<HTMLOutputElement>('#flow-speed-value');
const flowToggle = required<HTMLButtonElement>('#flow-toggle');
const flowDirection = required<HTMLButtonElement>('#flow-direction');
const pipeStatus = required<HTMLSelectElement>('#pipe-status');
const controlValve = required<HTMLElement>('#control-valve');
const valveCommand = required<HTMLInputElement>('#valve-command');
const valveCommandValue = required<HTMLOutputElement>('#valve-command-value');
const valveSupply = required<HTMLInputElement>('#valve-supply');
const valveSupplyValue = required<HTMLOutputElement>('#valve-supply-value');
const valveStiction = required<HTMLInputElement>('#valve-stiction');
const valveStictionValue = required<HTMLOutputElement>('#valve-stiction-value');
const valvePositionValue = required<HTMLOutputElement>('#valve-position-value');
const valveFlowValue = required<HTMLOutputElement>('#valve-flow-value');
const valvePressureValue = required<HTMLOutputElement>('#valve-pressure-value');
const valveSeverityValue = required<HTMLOutputElement>('#valve-severity-value');
const valvePower = required<HTMLButtonElement>('#valve-power');

speed.addEventListener('input', () => {
  const value = Number(speed.value);
  pump.setAttribute('speed', speed.value);
  pump.toggleAttribute('running', value > 0);
  speedValue.value = `${value} rpm`;
  pumpToggle.textContent = value > 0 ? 'Stop' : 'Start';
});

pumpStatus.addEventListener('change', () => pump.setAttribute('status', pumpStatus.value));
pumpQuality.addEventListener('change', () => pump.setAttribute('quality', pumpQuality.value));

pumpToggle.addEventListener('click', () => {
  const running = !pump.hasAttribute('running');
  pump.toggleAttribute('running', running);
  pump.setAttribute('speed', running ? speed.value : '0');
  pumpToggle.textContent = running ? 'Stop' : 'Start';
});

channels.addEventListener('change', () => {
  const count = Number(channels.value);
  controller.setAttribute('inputs', String(count));
  controller.setAttribute('outputs', String(count));
  controller.setAttribute('input-state', randomBits(count, .55));
  controller.setAttribute('output-state', randomBits(count, .38));
});

load.addEventListener('input', () => {
  controller.setAttribute('load', load.value);
  loadValue.value = `${load.value}%`;
});

activity.addEventListener('click', () => {
  const count = Number(controller.getAttribute('inputs') ?? 16);
  controller.setAttribute('activity', String(Number(controller.getAttribute('activity') ?? 0) + 1));
  controller.setAttribute('input-state', randomBits(count, .55));
});

controllerAlarm.addEventListener('click', () => {
  const alarm = controller.getAttribute('status') !== 'alarm';
  controller.setAttribute('status', alarm ? 'alarm' : 'normal');
  controllerAlarm.textContent = alarm ? 'Clear fault' : 'Toggle fault';
});

flowSpeed.addEventListener('input', () => {
  const value = Number(flowSpeed.value);
  processPipe.setAttribute('speed', String(value));
  flowSpeedValue.value = `${value.toFixed(2)}×`;
});

flowToggle.addEventListener('click', () => {
  const active = !processPipe.hasAttribute('active');
  processPipe.toggleAttribute('active', active);
  flowToggle.textContent = active ? 'Stop flow' : 'Start flow';
});

flowDirection.addEventListener('click', () => {
  const reverse = processPipe.getAttribute('direction') !== 'reverse';
  processPipe.setAttribute('direction', reverse ? 'reverse' : 'forward');
  flowDirection.textContent = reverse ? 'Forward flow' : 'Reverse flow';
});

pipeStatus.addEventListener('change', () => processPipe.setAttribute('status', pipeStatus.value));

valveCommand.addEventListener('input', () => {
  controlValve.setAttribute('command', valveCommand.value);
  valveCommandValue.value = `${valveCommand.value}%`;
});

valveSupply.addEventListener('input', () => {
  valveSupplyValue.value = `${Number(valveSupply.value).toFixed(1)} bar`;
});

valveStiction.addEventListener('input', () => {
  valveStictionValue.value = `${Number(valveStiction.value).toFixed(1)}%`;
});

valvePower.addEventListener('click', () => {
  const powered = !controlValve.hasAttribute('powered');
  controlValve.toggleAttribute('powered', powered);
  valvePower.textContent = powered ? 'Remove control air' : 'Restore control air';
});

const valveSimulation = new ControlValveSimulation({
  initialPosition: Number(controlValve.getAttribute('position') ?? 0),
  warningDeviation: 5,
  alarmDeviation: 15,
  warningDelay: .7,
  alarmDelay: 2,
  maximumPressureDrop: 8,
});

let previousSimulationTime = performance.now();
function simulateValve(now: number): void {
  const deltaSeconds = Math.min(.05, Math.max(0, (now - previousSimulationTime) / 1000));
  previousSimulationTime = now;

  const snapshot = valveSimulation.step({
    command: Number(valveCommand.value),
    powered: controlValve.hasAttribute('powered'),
    supplyPressure: Number(valveSupply.value),
    outletPressure: 1,
    capacity: 16,
    characteristic: 'equal-percentage',
    rangeability: 50,
    leakage: .0005,
    upstreamResistance: .05,
    travelTime: 2.4,
    failPosition: 0,
    deadband: .25,
    stiction: Number(valveStiction.value),
  }, deltaSeconds);

  controlValve.setAttribute('position', snapshot.position.toFixed(2));
  controlValve.setAttribute('flow', Math.max(0, snapshot.flow).toFixed(2));
  controlValve.setAttribute('status', snapshot.severity);
  controlValve.toggleAttribute('data-sim-moving', snapshot.moving);
  controlValve.setAttribute('data-pressure-in', snapshot.pressureIn.toFixed(3));
  controlValve.setAttribute('data-pressure-out', snapshot.pressureOut.toFixed(3));

  valvePositionValue.value = `${Math.round(snapshot.position)}%`;
  valveFlowValue.value = `${Math.max(0, snapshot.flow).toFixed(1)} m³/h`;
  valvePressureValue.value = `${snapshot.pressureDrop.toFixed(2)} bar`;
  valveSeverityValue.value = snapshot.severity.toUpperCase();
  valveSeverityValue.title = snapshot.activeRules.map((entry) => entry.message).join('\n');

  requestAnimationFrame(simulateValve);
}

requestAnimationFrame(simulateValve);

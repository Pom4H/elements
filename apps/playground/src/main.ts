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
const valvePosition = required<HTMLInputElement>('#valve-position');
const valvePositionValue = required<HTMLOutputElement>('#valve-position-value');
const valveCommand = required<HTMLInputElement>('#valve-command');
const valveCommandValue = required<HTMLOutputElement>('#valve-command-value');
const valveStatus = required<HTMLSelectElement>('#valve-status');
const valveFollow = required<HTMLButtonElement>('#valve-follow');
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

function setValvePosition(value: number): void {
  const position = Math.min(100, Math.max(0, value));
  const serialized = position.toFixed(1);
  controlValve.setAttribute('position', serialized);
  controlValve.setAttribute('flow', (position * .62).toFixed(1));
  valvePosition.value = serialized;
  valvePositionValue.value = `${Math.round(position)}%`;
}

valvePosition.addEventListener('input', () => setValvePosition(Number(valvePosition.value)));

valveCommand.addEventListener('input', () => {
  controlValve.setAttribute('command', valveCommand.value);
  valveCommandValue.value = `${valveCommand.value}%`;
});

valveStatus.addEventListener('change', () => controlValve.setAttribute('status', valveStatus.value));

let valveMotion: number | undefined;
valveFollow.addEventListener('click', () => {
  if (!controlValve.hasAttribute('powered')) return;
  if (valveMotion !== undefined) cancelAnimationFrame(valveMotion);

  const initial = Number(controlValve.getAttribute('position') ?? 0);
  const target = Number(controlValve.getAttribute('command') ?? 0);
  const startedAt = performance.now();
  const duration = 1100;

  const step = (now: number): void => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = progress < .5
      ? 4 * progress ** 3
      : 1 - (-2 * progress + 2) ** 3 / 2;
    setValvePosition(initial + (target - initial) * eased);
    if (progress < 1) valveMotion = requestAnimationFrame(step);
    else valveMotion = undefined;
  };

  valveMotion = requestAnimationFrame(step);
});

valvePower.addEventListener('click', () => {
  const powered = !controlValve.hasAttribute('powered');
  controlValve.toggleAttribute('powered', powered);
  valvePower.textContent = powered ? 'Remove control air' : 'Restore control air';
});
